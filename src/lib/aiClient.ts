export interface ChatCompletionMessage {
  role: 'system' | 'user' | 'assistant';
  content: string | Array<{ type: 'text'; text: string } | { type: 'image_url'; image_url: { url: string } }>;
}

const OPENROUTER_URL = 'https://openrouter.ai/api/v1/chat/completions';

/**
 * Simple non-streaming completion — used for background tasks (like summarizing a chat into
 * long-term memory) where we just need one final string back, not a live stream.
 */
export async function oneShotTextCompletion(messages: ChatCompletionMessage[]): Promise<string> {
  const apiKey = import.meta.env.VITE_OPENROUTER_API_KEY;
  const model = import.meta.env.VITE_OPENROUTER_MODEL || 'meta-llama/llama-3.1-8b-instruct:free';
  if (!apiKey) throw new AIRequestError('AI Chat is not configured yet.');

  const response = await fetch(OPENROUTER_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
      'HTTP-Referer': window.location.origin,
      'X-Title': 'MEV AI',
    },
    body: JSON.stringify({ model, messages, stream: false, temperature: 0.3 }),
  });

  if (!response.ok) throw new AIRequestError(`Request failed (${response.status})`);
  const data = await response.json();
  return data.choices?.[0]?.message?.content ?? '';
}

export class AIRequestError extends Error {}

/**
 * Streams a chat completion from OpenRouter token-by-token, calling onDelta for each chunk.
 * Pass an AbortSignal to allow the caller to stop generation mid-stream.
 *
 * NOTE: the OpenRouter key is used directly from the browser here for simplicity in this MVP.
 * For production, proxy this call through a Firebase Cloud Function so the key never ships
 * to the client and you can enforce per-user rate limits server-side.
 */
export async function streamChatCompletion(
  messages: ChatCompletionMessage[],
  onDelta: (chunk: string) => void,
  signal: AbortSignal
): Promise<string> {
  const apiKey = import.meta.env.VITE_OPENROUTER_API_KEY;
  const model = import.meta.env.VITE_OPENROUTER_MODEL || 'meta-llama/llama-3.1-8b-instruct:free';

  if (!apiKey) {
    throw new AIRequestError(
      'AI Chat is not configured yet. Add VITE_OPENROUTER_API_KEY to your .env file (get a free key at openrouter.ai/keys).'
    );
  }

  const response = await fetch(OPENROUTER_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
      'HTTP-Referer': window.location.origin,
      'X-Title': 'MEV AI',
    },
    body: JSON.stringify({ model, messages, stream: true, temperature: 0.7 }),
    signal,
  });

  if (!response.ok || !response.body) {
    const text = await response.text().catch(() => '');
    throw new AIRequestError(`AI request failed (${response.status}): ${text || response.statusText}`);
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = '';
  let fullText = '';

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split('\n');
    buffer = lines.pop() ?? '';

    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed.startsWith('data:')) continue;
      const data = trimmed.slice(5).trim();
      if (data === '[DONE]') continue;

      try {
        const parsed = JSON.parse(data);
        const delta: string | undefined = parsed.choices?.[0]?.delta?.content;
        if (delta) {
          fullText += delta;
          onDelta(delta);
        }
      } catch {
        // Ignore malformed SSE keep-alive lines
      }
    }
  }

  return fullText;
}

/**
 * Free vision-capable models on OpenRouter, tried in order. Any single free model can get
 * temporarily rate-limited upstream (429) when a lot of people are using it at once, so we
 * fall back to the next one instead of failing the whole request.
 */
const VISION_MODEL_CHAIN = [
  'google/gemma-4-31b-it:free',
  'google/gemma-4-26b-a4b-it:free',
  'nvidia/nemotron-3-nano-omni-30b-a3b-reasoning:free',
];

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * One-shot (non-streaming) completion for when the user attaches an image. Free-tier text
 * models can't see images, so this forces a vision-capable free model regardless of the
 * user's configured default. Free vision models can be slower/less reliable than text ones,
 * so we retry across a small chain of models before giving up.
 */
export async function visionCompletion(text: string, imageDataUrl: string, signal: AbortSignal): Promise<string> {
  const apiKey = import.meta.env.VITE_OPENROUTER_API_KEY;
  if (!apiKey) {
    throw new AIRequestError('AI Chat is not configured yet. Add VITE_OPENROUTER_API_KEY to your .env file.');
  }

  let lastError: string = '';

  for (let i = 0; i < VISION_MODEL_CHAIN.length; i++) {
    const model = VISION_MODEL_CHAIN[i];
    try {
      const response = await fetch(OPENROUTER_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${apiKey}`,
          'HTTP-Referer': window.location.origin,
          'X-Title': 'MEV AI',
        },
        body: JSON.stringify({
          model,
          messages: [
            {
              role: 'user',
              content: [
                { type: 'text', text: text || 'Describe this image in detail.' },
                { type: 'image_url', image_url: { url: imageDataUrl } },
              ],
            },
          ],
          stream: false,
        }),
        signal,
      });

      if (response.status === 429) {
        lastError = `${model} is rate-limited right now`;
        if (i < VISION_MODEL_CHAIN.length - 1) {
          await sleep(600);
          continue;
        }
        throw new AIRequestError(
          'All free vision models are busy right now (rate-limited). Please wait a few seconds and try again, or add your own free OpenRouter key for higher limits.'
        );
      }

      if (!response.ok) {
        const errText = await response.text().catch(() => '');
        lastError = `Image request failed (${response.status}): ${errText || response.statusText}`;
        continue;
      }

      const data = await response.json();
      const content = data.choices?.[0]?.message?.content ?? '';
      if (content.trim()) return content;
      lastError = `${model} returned an empty response`;
    } catch (err) {
      if ((err as Error).name === 'AbortError') throw err;
      if (err instanceof AIRequestError) throw err;
      lastError = (err as Error).message;
    }
  }

  throw new AIRequestError(lastError || 'Could not analyze this image right now. Please try again.');
}
