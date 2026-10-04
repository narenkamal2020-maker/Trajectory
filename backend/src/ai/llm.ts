/**
 * Optional LLM provider (OpenAI or a local Ollama model). Every caller must handle `null`
 * (provider disabled, timed out or returned invalid JSON) by falling back to the rule engines.
 */
import { z } from 'zod';
import { env } from '../config/env';
import { logger } from '../config/logger';

export interface ChatMessage { role: 'system' | 'user' | 'assistant'; content: string }

const TIMEOUT_MS = 20000;

export const llmEnabled = () =>
  env.LLM_PROVIDER === 'ollama' || (env.LLM_PROVIDER === 'openai' && !!env.OPENAI_API_KEY);

export const llmModelName = () => (env.LLM_PROVIDER === 'openai' ? env.OPENAI_MODEL : env.LLM_PROVIDER === 'ollama' ? env.OLLAMA_MODEL : 'rules');

async function rawCompletion(messages: ChatMessage[]): Promise<string | null> {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), TIMEOUT_MS);
  try {
    if (env.LLM_PROVIDER === 'openai') {
      const r = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        signal: ctrl.signal,
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${env.OPENAI_API_KEY}` },
        body: JSON.stringify({ model: env.OPENAI_MODEL, messages, temperature: 0.3, response_format: { type: 'json_object' } }),
      });
      if (!r.ok) throw new Error(`OpenAI ${r.status}`);
      const data = (await r.json()) as any;
      return data.choices?.[0]?.message?.content ?? null;
    }
    if (env.LLM_PROVIDER === 'ollama') {
      const r = await fetch(`${env.OLLAMA_URL}/api/chat`, {
        method: 'POST',
        signal: ctrl.signal,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ model: env.OLLAMA_MODEL, messages, stream: false, format: 'json', options: { temperature: 0.3 } }),
      });
      if (!r.ok) throw new Error(`Ollama ${r.status}`);
      const data = (await r.json()) as any;
      return data.message?.content ?? null;
    }
    return null;
  } finally {
    clearTimeout(timer);
  }
}

/** Ask the LLM for JSON matching `schema`. Returns null on any failure. */
export async function completeJson<T>(messages: ChatMessage[], schema: z.ZodType<T>): Promise<T | null> {
  if (!llmEnabled()) return null;
  try {
    const text = await rawCompletion(messages);
    if (!text) return null;
    const parsed = schema.safeParse(JSON.parse(text));
    if (!parsed.success) {
      logger.warn('LLM returned JSON that failed validation', { issues: parsed.error.issues.slice(0, 3) });
      return null;
    }
    return parsed.data;
  } catch (err: any) {
    logger.warn(`LLM call failed, using rule engine: ${err.message}`);
    return null;
  }
}

/**
 * Prepare untrusted text for a prompt: cap its length, strip control characters, and neutralise
 * anything that could close our delimiter tags or impersonate a chat role.
 */
export function sanitizeForPrompt(text: string, max: number): string {
  return text
    .slice(0, max)
    .replace(/<\/?\s*(candidate_answer|resume|system|assistant|user|instructions?)\b[^>]*>/gi, '[tag removed]')
    // eslint-disable-next-line no-control-regex
    .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/g, '');
}
