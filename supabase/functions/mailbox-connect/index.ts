// POST  — start Gmail OAuth: returns Google consent URL for the browser to open.
// GET   — health ping: reports whether Google credentials are configured.
//
// Deploy:  supabase functions deploy mailbox-connect          (verify-jwt ON)

import { createClient } from 'jsr:@supabase/supabase-js@2';
import { corsHeaders, json, signState, redirectBase } from '../_shared/crypto.ts';

const SCOPES = [
  'openid',
  'email',
  'https://www.googleapis.com/auth/gmail.send',
  'https://www.googleapis.com/auth/gmail.modify',
].join(' ');

const GOOGLE_PROVIDERS = new Set(['gmail', 'google']);

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  const clientId = Deno.env.get('GOOGLE_CLIENT_ID');
  const clientSecret = Deno.env.get('GOOGLE_CLIENT_SECRET');

  if (req.method === 'GET') {
    return json({
      ok: true,
      provider: 'gmail',
      google_configured: Boolean(clientId && clientSecret),
    });
  }

  if (req.method !== 'POST') return json({ error: 'method_not_allowed' }, 405);

  if (!clientId || !clientSecret) {
    return json({ error: 'google_not_configured', message: 'Provider credentials are not configured yet.' }, 501);
  }

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

  if (!GOOGLE_PROVIDERS.has(provider)) {
    return json({ error: 'provider_not_supported', message: 'Only Gmail is configured right now.' }, 501);
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

  const state = await signState(
    { uid: user.id, ws: workspaceId, email, exp: Date.now() + 10 * 60 * 1000 },
    clientSecret
  );

  const redirectUri = `${Deno.env.get('SUPABASE_URL')}/functions/v1/mailbox-google-callback`;
  const url = new URL('https://accounts.google.com/o/oauth2/v2/auth');
  url.searchParams.set('client_id', clientId);
  url.searchParams.set('redirect_uri', redirectUri);
  url.searchParams.set('response_type', 'code');
  url.searchParams.set('scope', SCOPES);
  url.searchParams.set('access_type', 'offline');
  url.searchParams.set('prompt', 'consent');
  url.searchParams.set('include_granted_scopes', 'true');
  url.searchParams.set('login_hint', email);
  url.searchParams.set('state', state);

  return json({ ok: true, url: url.toString(), returnTo: `${redirectBase()}/app/mailboxes` });
});
