import { useState, useRef, useCallback } from 'react';
import { v4 as uuid } from 'uuid';
import { streamChatCompletion, visionCompletion, ChatCompletionMessage, AIRequestError } from '../lib/aiClient';
import { createChat, appendMessage } from '../lib/chatStore';
import { searchWeb } from '../lib/webSearch';
import { buildImageUrl } from '../lib/imageClient';

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  error?: boolean;
}

export interface PendingAttachment {
  kind: 'image' | 'pdf';
  name: string;
  dataUrl?: string;
  text?: string;
}

export interface SendOptions {
  attachment?: PendingAttachment;
  webSearch?: boolean;
  imageGen?: boolean;
}

const LANGUAGE_NAMES: Record<string, string> = {
  en: 'English', hi: 'Hindi', es: 'Spanish', fr: 'French', de: 'German', ja: 'Japanese',
};

function buildSystemPrompt(language?: string, extraInstructions?: string): ChatCompletionMessage {
  const languageName = LANGUAGE_NAMES[language ?? 'en'] ?? 'English';
  const base = `You are MEV AI, a helpful assistant built by Vishal Gurjar. If asked who made you, say Vishal Gurjar. If asked what "MEV" stands for, say it stands for "Master Elite Vishal".

Talk like a real person having a conversation, not like a corporate chatbot:
- Match the user's tone, energy, and language mix. If they write in Hinglish or casual ${languageName}, reply the same way instead of switching to stiff formal text.
- Keep everyday replies short and conversational (a few sentences). Don't pad answers with unnecessary headers, bullet lists, or bold text unless the content is genuinely structured (steps, comparisons, code, data) or the user asks for a list.
- Don't repeat the user's question back to them before answering. Don't over-explain or add disclaimers no one asked for.
- Have a bit of personality and warmth — react naturally, ask a casual follow-up when it fits, avoid sounding like a template.
- Use markdown and fenced code blocks with language tags only when actually sharing code or something that needs formatting.
- Default to replying in ${languageName}, matching however casually or formally the user writes.`;
  return { role: 'system', content: extraInstructions ? `${base}\n\n${extraInstructions}` : base };
}

export function useChat(
  uid: string | undefined,
  initialMessages: ChatMessage[] = [],
  initialChatId: string | null = null,
  language?: string,
  options?: { extraInstructions?: string; persist?: boolean }
) {
  const { extraInstructions: initialExtra, persist = true } = options ?? {};
  const [messages, setMessages] = useState<ChatMessage[]>(initialMessages);
  const [isStreaming, setIsStreaming] = useState(false);
  const chatIdRef = useRef<string | null>(initialChatId);
  const abortRef = useRef<AbortController | null>(null);

  const languageRef = useRef(language);
  languageRef.current = language;
  const extraInstructionsRef = useRef(initialExtra);

  const toApiMessages = (history: ChatMessage[]): ChatCompletionMessage[] => [
    buildSystemPrompt(languageRef.current, extraInstructionsRef.current),
    ...history.filter((m) => !m.error).map((m) => ({ role: m.role, content: m.content })),
  ];

  const persistTurn = useCallback(
    async (history: ChatMessage[], finalText: string) => {
      if (!uid || !persist) return;
      try {
        if (!chatIdRef.current) {
          const title = history[0]?.content ?? 'New chat';
          chatIdRef.current = await createChat(uid, title);
        }
        const lastUser = history[history.length - 1];
        if (lastUser?.role === 'user') await appendMessage(chatIdRef.current, 'user', lastUser.content);
        if (finalText.trim()) await appendMessage(chatIdRef.current, 'assistant', finalText);
      } catch {
        // Best-effort — chat still works if this fails (e.g. offline)
      }
    },
    [uid, persist]
  );

  const runStreamingCompletion = useCallback(
    async (history: ChatMessage[]) => {
      const assistantId = uuid();
      setMessages([...history, { id: assistantId, role: 'assistant', content: '' }]);
      setIsStreaming(true);
      const controller = new AbortController();
      abortRef.current = controller;

      let finalText = '';
      try {
        finalText = await streamChatCompletion(
          toApiMessages(history),
          (chunk) => {
            finalText += chunk;
            setMessages((prev) => prev.map((m) => (m.id === assistantId ? { ...m, content: m.content + chunk } : m)));
          },
          controller.signal
        );
      } catch (err) {
        if ((err as Error).name === 'AbortError') {
          // stopped intentionally
        } else {
          const msg = err instanceof AIRequestError ? err.message : 'Something went wrong generating a response.';
          setMessages((prev) => prev.map((m) => (m.id === assistantId ? { ...m, content: msg, error: true } : m)));
          setIsStreaming(false);
          abortRef.current = null;
          return;
        }
      }
      setIsStreaming(false);
      abortRef.current = null;
      void persistTurn(history, finalText);
    },
    [persistTurn]
  );

  const runOneShot = useCallback(
    async (history: ChatMessage[], producer: () => Promise<string>) => {
      const assistantId = uuid();
      setMessages([...history, { id: assistantId, role: 'assistant', content: '' }]);
      setIsStreaming(true);
      let finalText = '';
      try {
        finalText = await producer();
        setMessages((prev) => prev.map((m) => (m.id === assistantId ? { ...m, content: finalText } : m)));
      } catch (err) {
        const msg = err instanceof AIRequestError ? err.message : 'Something went wrong. Please try again.';
        setMessages((prev) => prev.map((m) => (m.id === assistantId ? { ...m, content: msg, error: true } : m)));
        setIsStreaming(false);
        return;
      }
      setIsStreaming(false);
      void persistTurn(history, finalText);
    },
    [persistTurn]
  );

  const sendMessage = useCallback(
    (content: string, opts?: SendOptions) => {
      if (isStreaming) return;
      if (!content.trim() && !opts?.attachment) return;

      const displayText =
        content.trim() || (opts?.attachment ? `[Attached: ${opts.attachment.name}]` : '');
      const userMessage: ChatMessage = { id: uuid(), role: 'user', content: displayText };
      const next = [...messages, userMessage];
      setMessages(next);

      if (opts?.imageGen) {
        const seed = Math.floor(Math.random() * 1_000_000);
        const url = buildImageUrl(content.trim() || 'a beautiful image', seed);
        void runOneShot(next, async () => {
          await new Promise<void>((resolve) => {
            const img = new Image();
            img.onload = () => resolve();
            img.onerror = () => resolve();
            img.src = url;
          });
          return `![${content.trim()}](${url})`;
        });
        return;
      }

      if (opts?.webSearch) {
        void runOneShot(next, async () => {
          const result = await searchWeb(content.trim());
          const sources = result.sources.length
            ? `\n\n**Sources:**\n${result.sources.map((s) => `- [${s.title}](${s.url})`).join('\n')}`
            : '';
          return result.answer + sources;
        });
        return;
      }

      if (opts?.attachment?.kind === 'image' && opts.attachment.dataUrl) {
        const controller = new AbortController();
        abortRef.current = controller;
        void runOneShot(next, () => visionCompletion(content.trim(), opts.attachment!.dataUrl!, controller.signal));
        return;
      }

      if (opts?.attachment?.kind === 'pdf' && opts.attachment.text) {
        extraInstructionsRef.current = `The user has attached a PDF ("${opts.attachment.name}"). Use this document content to answer:\n\n${opts.attachment.text}`;
      }

      void runStreamingCompletion(next);
    },
    [messages, isStreaming, runStreamingCompletion, runOneShot]
  );

  const stopGeneration = useCallback(() => {
    abortRef.current?.abort();
  }, []);

  const regenerateLast = useCallback(() => {
    if (isStreaming) return;
    const lastUserIndex = [...messages].reverse().findIndex((m) => m.role === 'user');
    if (lastUserIndex === -1) return;
    const cutoff = messages.length - lastUserIndex;
    void runStreamingCompletion(messages.slice(0, cutoff));
  }, [messages, isStreaming, runStreamingCompletion]);

  const editMessage = useCallback(
    (id: string, newContent: string) => {
      if (isStreaming) return;
      const index = messages.findIndex((m) => m.id === id);
      if (index === -1) return;
      const history = [...messages.slice(0, index), { ...messages[index], content: newContent.trim() }];
      void runStreamingCompletion(history);
    },
    [messages, isStreaming, runStreamingCompletion]
  );

  return { messages, isStreaming, sendMessage, stopGeneration, regenerateLast, editMessage, chatId: chatIdRef.current };
}
