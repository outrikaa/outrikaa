// Shared helpers for OUTRIKAA mailbox edge functions (Deno runtime).

export const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
};

export function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json', ...corsHeaders },
  });
}

export function redirect(location: string): Response {
  return new Response(null, { status: 302, headers: { Location: location } });
}

const enc = new TextEncoder();

function toBase64Url(bytes: Uint8Array): string {
  let bin = '';
  for (const b of bytes) bin += String.fromCharCode(b);
  return btoa(bin).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

export function base64UrlEncode(str: string): string {
  return toBase64Url(enc.encode(str));
}

export function base64UrlDecode(str: string): string {
  const pad = str.replace(/-/g, '+').replace(/_/g, '/');
  const bin = atob(pad + '='.repeat((4 - (pad.length % 4)) % 4));
  const bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
  return new TextDecoder().decode(bytes);
}

async function hmacKey(secret: string): Promise<CryptoKey> {
  return crypto.subtle.importKey('raw', enc.encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, [
    'sign',
    'verify',
  ]);
}

export async function hmacSign(payload: string, secret: string): Promise<string> {
  const sig = await crypto.subtle.sign('HMAC', await hmacKey(secret), enc.encode(payload));
  return toBase64Url(new Uint8Array(sig));
}

export async function hmacVerify(payload: string, signature: string, secret: string): Promise<boolean> {
  const expected = await hmacSign(payload, secret);
  return expected === signature;
}

export interface OAuthState {
  uid: string;
  ws: string;
  email: string;
  exp: number;
  /** 'gmail' | 'outlook' — which OAuth provider signed this state. */
  p?: string;
}

export async function signState(state: OAuthState, secret: string): Promise<string> {
  const payload = base64UrlEncode(JSON.stringify(state));
  const sig = await hmacSign(payload, secret);
  return `${payload}.${sig}`;
}

export async function verifyState(raw: string, secret: string): Promise<OAuthState | null> {
  const [payload, sig] = raw.split('.');
  if (!payload || !sig) return null;
  if (!(await hmacVerify(payload, sig, secret))) return null;
  try {
    const state = JSON.parse(base64UrlDecode(payload)) as OAuthState;
    if (!state.exp || Date.now() > state.exp) return null;
    return state;
  } catch {
    return null;
  }
}

export function redirectBase(): string {
  return Deno.env.get('SITE_URL') ?? 'https://outrikaa.vercel.app';
}
