// POST  — start OAuth: returns consent URL (Google or Microsoft) for the browser.
// GET   — health ping: reports which provider credentials are configured.
//
// Deploy:  supabase functions deploy mailbox-connect          (verify-jwt ON)

import { createClient } from 'jsr:@supabase/supabase-js@2';
import { corsHeaders, json, signState, redirectBase } from '../_shared/crypto.ts';
import { msAuthorizeUrl } from '../_shared/microsoft.ts';

const SCOPES = [
  'openid',
  'email',
  'https://www.googleapis.com/auth/gmail.send',
  'https://www.googleapis.com/auth/gmail.modify',
].join(' ');

const GOOGLE_PROVIDERS = new Set(['gmail', 'google']);
const MICROSOFT_PROVIDERS = new Set(['outlook', 'microsoft365']);

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  const googleId = Deno.env.get('GOOGLE_CLIENT_ID');
  const googleSecret = Deno.env.get('GOOGLE_CLIENT_SECRET');
  const msId = Deno.env.get('OUTLOOK_CLIENT_ID');
  const msSecret = Deno.env.get('OUTLOOK_CLIENT_SECRET');

  if (req.method === 'GET') {
    return json({
      ok: true,
      google_configured: Boolean(googleId && googleSecret),
      outlook_configured: Boolean(msId && msSecret),
    });
  }

  if (req.method !== 'POST') return json({ error: 'method_not_allowed' }, 405);

  const authHeader = req.headers.get('Authorization') ?? '';
  const jwt = authHeader.replace(/^Bearer\s+/i, '');
  if (!jwt) return json({ error: 'unauthorized' }, 401);

  const supabase = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_ANON_KEY')!, {
    global: { headers: { Authorization: authHeader } },
  });

  const { data: userData, error: userError } = await supabase.auth.getUser(jwt);
  if (userError || !userData?.user) return json({ error: 'unauthorized' }, 401);
  const user = userData.user;

  let body: { provider?: string; email?: string; workspaceId?: string };
  try {
    body = await req.json();
  } catch {
    return json({ error: 'invalid_json' }, 400);
  }

  const provider = (body.provider ?? '').toLowerCase();
  const email = (body.email ?? '').trim().toLowerCase();
  const workspaceId = body.workspaceId ?? '';

  const isGoogle = GOOGLE_PROVIDERS.has(provider);
  const isMicrosoft = MICROSOFT_PROVIDERS.has(provider);

  if (!isGoogle && !isMicrosoft) {
    return json(
      { error: 'provider_not_supported', message: 'Custom SMTP is not configured right now.' },
      501
    );
  }

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return json({ error: 'invalid_email', message: 'Enter a valid mailbox address.' }, 400);
  }
  if (!workspaceId) return json({ error: 'missing_workspace' }, 400);

  // The user must be a member of the target workspace (RLS enforces this read).
  const { data: membership, error: memberError } = await supabase
    .from('workspace_members')
    .select('id')
    .eq('workspace_id', workspaceId)
    .eq('user_id', user.id)
    .maybeSingle();
  if (memberError || !membership) return json({ error: 'forbidden', message: 'Not a workspace member.' }, 403);

  const stateP = isMicrosoft ? 'outlook' : 'gmail';
  const signingSecret = isMicrosoft ? msSecret : googleSecret;
  const signingClientId = isMicrosoft ? msId : googleId;

  if (!signingClientId || !signingSecret) {
    return json(
      {
        error: isMicrosoft ? 'outlook_not_configured' : 'google_not_configured',
        message: 'Provider credentials are not configured yet.',
      },
      501
    );
  }

  const state = await signState(
    { uid: user.id, ws: workspaceId, email, exp: Date.now() + 10 * 60 * 1000, p: stateP },
    signingSecret
  );

  const redirectUri = `${Deno.env.get('SUPABASE_URL')}/functions/v1/mailbox-google-callback`;
  let url: string;

  if (isMicrosoft) {
    url = msAuthorizeUrl({
      clientId: signingClientId,
      redirectUri,
      state,
      loginHint: email,
    });
  } else {
    const gUrl = new URL('https://accounts.google.com/o/oauth2/v2/auth');
    gUrl.searchParams.set('client_id', signingClientId);
    gUrl.searchParams.set('redirect_uri', redirectUri);
    gUrl.searchParams.set('response_type', 'code');
    gUrl.searchParams.set('scope', SCOPES);
    gUrl.searchParams.set('access_type', 'offline');
    gUrl.searchParams.set('prompt', 'consent');
    gUrl.searchParams.set('include_granted_scopes', 'true');
    gUrl.searchParams.set('login_hint', email);
    gUrl.searchParams.set('state', state);
    url = gUrl.toString();
  }

  return json({ ok: true, url, returnTo: `${redirectBase()}/app/mailboxes` });
});
