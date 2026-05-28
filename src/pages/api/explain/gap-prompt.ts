import type { APIRoute } from 'astro';
import { z } from 'zod';
import { getSession } from '../../../lib/auth';
import { requestGapPrompts } from '../../../lib/ai/gap-prompt';
import type { LLMClient } from '../../../lib/ai/gap-prompt';
import { logError } from '../../../lib/observability/logger';

export const prerender = false;

const bodySchema = z.object({
  explanation: z.string().min(1).max(20000),
});

function isGapPromptEnabled(): boolean {
  return process.env.FEATURE_AI_GAP_PROMPT === '1';
}

function buildLLMClient(): LLMClient {
  return {
    async complete(systemPrompt: string, userMessage: string): Promise<string> {
      const apiKey = process.env.ANTHROPIC_API_KEY;
      if (!apiKey) throw new Error('ANTHROPIC_API_KEY not set');

      const res = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          'x-api-key': apiKey,
          'anthropic-version': '2023-06-01',
        },
        body: JSON.stringify({
          model: 'claude-3-haiku-20240307',
          max_tokens: 512,
          system: systemPrompt,
          messages: [{ role: 'user', content: userMessage }],
        }),
        signal: AbortSignal.timeout(15_000),
      });

      if (!res.ok) {
        const text = await res.text();
        throw new Error(`Anthropic API error ${res.status}: ${text}`);
      }

      const data = (await res.json()) as {
        content: Array<{ type: string; text: string }>;
      };

      const block = data.content.find((b) => b.type === 'text');
      if (!block) throw new Error('No text block in Anthropic response');
      return block.text;
    },
  };
}

export const POST: APIRoute = async ({ request }) => {
  if (!isGapPromptEnabled()) {
    return new Response(JSON.stringify({ error: 'Feature not enabled' }), {
      status: 404,
      headers: { 'content-type': 'application/json' },
    });
  }

  const session = await getSession(request.headers);
  if (!session?.user?.id) {
    return new Response('Unauthorized', { status: 401 });
  }

  let raw: unknown;
  try {
    raw = await request.json();
  } catch {
    return new Response('Bad JSON', { status: 400 });
  }

  const parsed = bodySchema.safeParse(raw);
  if (!parsed.success) {
    return new Response(JSON.stringify({ error: parsed.error.issues }), {
      status: 400,
      headers: { 'content-type': 'application/json' },
    });
  }

  let result: Awaited<ReturnType<typeof requestGapPrompts>>;
  try {
    result = await requestGapPrompts(parsed.data.explanation, buildLLMClient());
  } catch (err) {
    logError('POST /api/explain/gap-prompt', err, { route: '/api/explain/gap-prompt', method: 'POST' });
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { 'content-type': 'application/json' },
    });
  }

  return new Response(JSON.stringify(result), {
    status: 200,
    headers: { 'content-type': 'application/json' },
  });
};
