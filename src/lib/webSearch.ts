import { AIRequestError } from './aiClient';

export interface SearchSource {
  url: string;
  title: string;
}

export interface SearchResult {
  answer: string;
  sources: SearchSource[];
}

const OPENROUTER_URL = 'https://openrouter.ai/api/v1/chat/completions';

/**
 * OpenRouter's ":online" model suffix enables live web search grounding — the model
 * fetches real results and returns citations in the response's `annotations` field.
 * This reuses the same OpenRouter key as AI Chat, so no separate search API is needed.
 */
export async function searchWeb(queryText: string): Promise<SearchResult> {
  const apiKey = import.meta.env.VITE_OPENROUTER_API_KEY;
  const baseModel = import.meta.env.VITE_OPENROUTER_MODEL || 'meta-llama/llama-3.1-8b-instruct:free';

  if (!apiKey) {
    throw new AIRequestError('Web Search is not configured yet. Add VITE_OPENROUTER_API_KEY to your .env file.');
  }

  const response = await fetch(OPENROUTER_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
      'HTTP-Referer': window.location.origin,
      'X-Title': 'MEV AI',
    },
    body: JSON.stringify({
      model: `${baseModel}:online`,
      messages: [
        {
          role: 'system',
          content: 'Answer the user\'s question using current web results. Be concise and cite facts that come from sources.',
        },
        { role: 'user', content: queryText },
      ],
      stream: false,
    }),
  });

  if (!response.ok) {
    const text = await response.text().catch(() => '');
    throw new AIRequestError(`Search failed (${response.status}): ${text || response.statusText}`);
  }

  const data = await response.json();
  const message = data.choices?.[0]?.message;
  const answer: string = message?.content ?? '';

  interface Annotation {
    type: string;
    url_citation?: { url: string; title?: string };
  }
  const annotations: Annotation[] = message?.annotations ?? [];
  const sources: SearchSource[] = annotations
    .filter((a) => a.type === 'url_citation' && a.url_citation)
    .map((a) => ({ url: a.url_citation!.url, title: a.url_citation!.title || a.url_citation!.url }));

  return { answer, sources };
}
