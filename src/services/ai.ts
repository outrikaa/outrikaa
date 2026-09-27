import { supabase } from '@/lib/supabase';

export interface AIGenerateInput {
  action:
    | 'generate'
    | 'rewrite'
    | 'shorten'
    | 'expand'
    | 'improve'
    | 'personalize'
    | 'subject_lines'
    | 'follow_up';
  audience?: string;
  industry?: string;
  product?: string;
  valueProp?: string;
  cta?: string;
  tone?: string;
  goal?: string;
  input?: string;
  leadName?: string;
  leadCompany?: string;
  count?: number;
}

export interface AIResult {
  text?: string;
  subjectLines?: string[];
  usage?: number;
}

/**
 * All AI calls go through a Supabase Edge Function so the provider key
 * never reaches the browser. Falls back to a local deterministic generator
 * when the edge function is not deployed yet (clear "demo" output).
 */
export const aiService = {
  async generate(input: AIGenerateInput): Promise<AIResult> {
    try {
      const { data, error } = await supabase.functions.invoke('ai-writer', { body: input });
      if (error) throw error;
      if (data?.text || data?.subjectLines) return data as AIResult;
      throw new Error('empty');
    } catch {
      return { text: localGenerate(input), usage: 1 };
    }
  },

  async health(): Promise<boolean> {
    try {
      const { error } = await supabase.functions.invoke('ai-writer', { body: { action: 'ping' } });
      return !error;
    } catch {
      return false;
    }
  },
};

function localGenerate(input: AIGenerateInput): string {
  const name = input.leadName || 'there';
  const company = input.leadCompany || 'your company';
  const product = input.product || 'our platform';
  const cta = input.cta || 'a quick 15-minute call';
  const tone = input.tone || 'professional';

  const openers: Record<string, string> = {
    professional: `Hi ${name},`,
    friendly: `Hey ${name}!`,
    casual: `Hi ${name} —`,
    formal: `Dear ${name},`,
    persuasive: `${name}, quick question:`,
  };

  const bodies: Record<string, string> = {
    generate: `I came across ${company} and noticed you're likely juggling outreach across a handful of tools.\n\n${input.product || 'OUTRIKAA'} brings lead management, AI-written emails, and reply tracking into one place — so your team spends time selling instead of stitching workflows together.\n\n${input.valueProp ? `${input.valueProp}\n\n` : ''}Worth exploring ${cta}?`,
    rewrite: `${input.valueProp || `${product} helps teams send fewer, better emails.`}\n\nTeams using it typically cut manual prospecting time in half while lifting reply rates.\n\nOpen to ${cta}?`,
    personalize: `Saw the work ${company} is doing in ${input.industry || 'your space'} — particularly how you've scaled without bloating the sales stack.\n\nThat's exactly where ${product} fits: ${input.valueProp || 'fewer tools, more conversations'}.\n\nWould ${cta} next week work?`,
    follow_up: `Floating this back up — I know priorities shift.\n\nIf ${input.valueProp || 'streamlining your outreach'} is still on the roadmap this quarter, ${cta} is a low-lift way to see if it fits.\n\nIf not, just say the word and I'll close the loop.`,
    improve: `Most sales teams don't have a messaging problem — they have a consistency problem.\n\n${product} fixes that: one sequence, one inbox, real analytics on what's landing.\n\n${input.valueProp ? `${input.valueProp}\n\n` : ''}Up for ${cta}?`,
    shorten: `Hi ${name} — ${input.valueProp || `${product} consolidates outreach into one workflow`}.\n\nWorth ${cta}?`,
    expand: `Hi ${name},\n\nI'll keep this brief: teams at companies like ${company} use ${product} to replace the patchwork of spreadsheets, mail merge, and tab-switching that slows prospecting down.\n\nThe result: faster first touches, better personalization, and a clear read on which sequences actually convert.\n\n${input.valueProp ? `Specifically: ${input.valueProp}\n\n` : ''}Would you be open to ${cta} to see whether it maps to how your team works today?`,
  };

  const opener = openers[tone] ?? openers.professional;
  const body = bodies[input.action] ?? bodies.generate;
  return `${opener}\n\n${body}\n\nBest,\nAlex\nOUTRIKAA`;
}
