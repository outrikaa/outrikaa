// OAuth redirect target for Gmail / Outlook mailbox connection.
//
// GET /functions/v1/mailbox-google-callback?code=...&state=...
//   1. verifies the signed state (which provider signed it via state.p)
//   2. exchanges the authorization code for access + refresh tokens
//   3. confirms the granted account matches the requested mailbox address
//   4. stores tokens (service-role only table) and upserts the mailbox row
//   5. redirects back to the app
//
// Deploy:  supabase functions deploy mailbox-google-callback --no-verify-jwt

import { createClient } from 'jsr:@supabase/supabase-js@2';
import { json, verifyState, redirect, redirectBase, type OAuthState } from '../_shared/crypto.ts';
import { exchangeMSCode } from '../_shared/microsoft.ts';

function fail(code: string): Response {
  const url = new URL(`${redirectBase()}/app/mailboxes`);
  url.searchParams.set('connect_error', code);
  return redirect(url.toString());
}

async function loadState(rawState: string): Promise<{ state: OAuthState; kind: 'gmail' | 'outlook' } | null> {
  const googleSecret = Deno.env.get('GOOGLE_CLIENT_SECRET');
  const msSecret = Deno.env.get('OUTLOOK_CLIENT_SECRET');

  if (googleSecret) {
    const state = await verifyState(rawState, googleSecret);
    if (state) return { state, kind: 'gmail' };
  }
  if (msSecret) {
    const state = await verifyState(rawState, msSecret);
    if (state) return { state, kind: 'outlook' };
  }
  return null;
}

Deno.serve(async (req) => {
  if (req.method !== 'GET') return json({ error: 'method_not_allowed' }, 405);

  const url = new URL(req.url);

  // Provider returned an error (denied consent, invalid client, ...)
  if (url.searchParams.get('error')) {
    const err = url.searchParams.get('error');
    return fail(err === 'access_denied' ? 'access_denied' : `oauth_${err ?? 'error'}`);
  }

  const code = url.searchParams.get('code');
  const rawState = url.searchParams.get('state');
  if (!code || !rawState) return fail('missing_params');

  const verified = await loadState(rawState);
  if (!verified) return fail('invalid_state');
  const { state, kind } = verified;

  const redirectUri = `${Deno.env.get('SUPABASE_URL')}/functions/v1/mailbox-google-callback`;
  let actualEmail = '';
  let accessToken = '';
  let refreshToken = '';
  let expiresIn = 3500;
  let grantedScopes: string[] = [];
  let googleSub: string | null = null;

  if (kind === 'outlook') {
    const msId = Deno.env.get('OUTLOOK_CLIENT_ID');
    const msSecret = Deno.env.get('OUTLOOK_CLIENT_SECRET');
    if (!msId || !msSecret) return fail('not_configured');

    const tokens = await exchangeMSCode(code, redirectUri);
    if (!tokens?.access_token) return fail('token_exchange_failed');
    if (!tokens.refresh_token) return fail('no_refresh_token');

    // Confirm which Microsoft account actually granted consent.
    const profileRes = await fetch('https://graph.microsoft.com/v1.0/me', {
      headers: { Authorization: `Bearer ${tokens.access_token}` },
    });
    if (!profileRes.ok) return fail('profile_fetch_failed');
    const profile = await profileRes.json();
    actualEmail = String(profile.mail ?? profile.userPrincipalName ?? '').toLowerCase();
    if (!actualEmail || actualEmail !== state.email) return fail('email_mismatch');

    accessToken = tokens.access_token;
    refreshToken = tokens.refresh_token;
    expiresIn = Number(tokens.expires_in ?? 3500);
    grantedScopes = String(tokens.scope ?? '').split(' ').filter(Boolean);
  } else {
    const clientId = Deno.env.get('GOOGLE_CLIENT_ID');
    const clientSecret = Deno.env.get('GOOGLE_CLIENT_SECRET');
    if (!clientId || !clientSecret) return fail('not_configured');

    // 1. Exchange the code for tokens.
    const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        code,
        client_id: clientId,
        client_secret: clientSecret,
        redirect_uri: redirectUri,
        grant_type: 'authorization_code',
      }),
    });
    if (!tokenRes.ok) return fail('token_exchange_failed');
    const tokens = await tokenRes.json();
    if (!tokens.access_token || !tokens.refresh_token) return fail('no_refresh_token');

    // 2. Confirm which Gmail account actually granted consent.
    const profileRes = await fetch('https://gmail.googleapis.com/gmail/v1/users/me/profile', {
      headers: { Authorization: `Bearer ${tokens.access_token}` },
    });
    if (!profileRes.ok) return fail('profile_fetch_failed');
    const profile = await profileRes.json();
    actualEmail = String(profile.emailAddress ?? '').toLowerCase();
    if (actualEmail !== state.email) return fail('email_mismatch');

    accessToken = tokens.access_token;
    refreshToken = tokens.refresh_token;
    expiresIn = Number(tokens.expires_in ?? 3500);
    grantedScopes = String(tokens.scope ?? '').split(' ').filter(Boolean);
    googleSub = profile.emailAddress ?? null;
  }

  // 3. Persist (service role bypasses RLS; tokens table has no user policies).
  const admin = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);

  const expiresAt = new Date(Date.now() + expiresIn * 1000).toISOString();
  const providerRow = kind === 'outlook' ? 'outlook' : 'gmail';

  const { data: mailbox, error: mailboxError } = await admin
    .from('mailboxes')
    .upsert(
      {
        workspace_id: state.ws,
        email_address: actualEmail,
        provider: providerRow,
        status: 'connected',
        health_score: 100,
        connected_at: new Date().toISOString(),
        disconnected_at: null,
        last_sync_at: new Date().toISOString(),
      },
      { onConflict: 'workspace_id,email_address' }
    )
    .select('id')
    .single();

  if (mailboxError || !mailbox) return fail('mailbox_save_failed');

  const { error: credError } = await admin.from('mailbox_credentials').upsert(
    {
      mailbox_id: mailbox.id,
      provider: providerRow,
      access_token: accessToken,
      refresh_token: refreshToken,
      token_expires_at: expiresAt,
      granted_scopes: grantedScopes,
      google_sub: googleSub,
    },
    { onConflict: 'mailbox_id' }
  );
  if (credError) return fail('credential_save_failed');

  const okUrl = new URL(`${redirectBase()}/app/mailboxes`);
  okUrl.searchParams.set('connected', providerRow);
  return redirect(okUrl.toString());
});
