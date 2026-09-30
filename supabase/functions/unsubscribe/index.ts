// One-click unsubscribe target used by the button in outgoing emails.
//
// GET  /unsubscribe?c=<campaign>&l=<lead>   -> HTML confirmation page
// POST /unsubscribe (List-Unsubscribe=One-Click) -> 200 text
//
// Deploy:  supabase functions deploy unsubscribe --no-verify-jwt

import { createClient } from 'jsr:@supabase/supabase-js@2';

const PAGE = (title: string, message: string) => `<!DOCTYPE html>
<html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${title}</title></head>
<body style="margin:0;min-height:100vh;display:flex;align-items:center;justify-content:center;background:#0b0d11;font-family:Arial,Helvetica,sans-serif">
  <div style="text-align:center;padding:32px;max-width:420px">
    <div style="font-size:40px;line-height:1">&#10003;</div>
    <h1 style="color:#fff;font-size:22px;margin:16px 0 8px">${title}</h1>
    <p style="color:#94a3b8;font-size:14px;line-height:1.6;margin:0">${message}</p>
    <p style="color:#475569;font-size:12px;margin-top:24px">OUTRIKAA</p>
  </div>
</body></html>`;

async function applyUnsubscribe(leadId: string, campaignId: string | null): Promise<'ok' | 'not_found'> {
  const admin = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);

  const { data: lead } = await admin
    .from('leads')
    .select('id, workspace_id, status')
    .eq('id', leadId)
    .maybeSingle();
  if (!lead) return 'not_found';

  if (lead.status !== 'unsubscribed') {
    await admin
      .from('leads')
      .update({ status: 'unsubscribed', unsubscribed_at: new Date().toISOString() })
      .eq('id', leadId);
  }

  let leadCampaign = campaignId;
  if (leadCampaign) {
    await admin
      .from('campaign_leads')
      .update({ status: 'unsubscribed' })
      .eq('campaign_id', leadCampaign)
      .eq('lead_id', leadId)
      .neq('status', 'unsubscribed');
  } else {
    const { data: rows } = await admin
      .from('campaign_leads')
      .select('campaign_id')
      .eq('lead_id', leadId);
    for (const row of rows ?? []) {
      await admin
        .from('campaign_leads')
        .update({ status: 'unsubscribed' })
        .eq('campaign_id', row.campaign_id)
        .eq('lead_id', leadId)
        .neq('status', 'unsubscribed');
    }
    leadCampaign = null;
  }

  await admin
    .from('scheduled_emails')
    .update({ status: 'canceled', error: 'unsubscribed' })
    .eq('lead_id', leadId)
    .eq('status', 'scheduled');

  await admin.from('email_events').insert({
    workspace_id: lead.workspace_id,
    event_type: 'unsubscribed',
    recipient: leadId,
    metadata: campaignId ? { campaign_id: campaignId } : {},
  });

  return 'ok';
}

Deno.serve(async (req) => {
  const url = new URL(req.url);
  const leadId = url.searchParams.get('l') ?? '';
  const campaignId = url.searchParams.get('c');
  const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

  if (!uuid.test(leadId)) {
    if (req.method === 'POST') return new Response('ok', { status: 200 });
    return new Response(PAGE('Invalid link', 'This unsubscribe link is not valid.'), {
      status: 400,
      headers: { 'Content-Type': 'text/html; charset=utf-8' },
    });
  }

  const result = await applyUnsubscribe(leadId, campaignId && uuid.test(campaignId) ? campaignId : null);

  if (req.method === 'POST') {
    return new Response('ok', { status: 200, headers: { 'Content-Type': 'text/plain' } });
  }

  const html =
    result === 'ok'
      ? PAGE("You're unsubscribed", 'You will not receive any more emails from us on this address. This may take a few minutes to fully process.')
      : PAGE('Not found', 'We could not find that subscription. No action was needed.');

  return new Response(html, {
    status: result === 'ok' ? 200 : 404,
    headers: { 'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': 'no-store' },
  });
});
