import { useState, useRef, useCallback } from 'react';
import { v4 as uuid } from 'uuid';
import { streamChatCompletion, visionCompletion, ChatCompletionMessage, AIRequestError } from '../lib/aiClient';
import { createChat, appendMessage } from '../lib/chatStore';
import { searchWeb } from '../lib/webSearch';
import { buildImageUrl } from '../lib/imageClient';
import { updateMemoryFromChat } from '../lib/memory';

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

function buildSystemPrompt(language?: string, extraInstructions?: string, memory?: string): ChatCompletionMessage {
  const languageName = LANGUAGE_NAMES[language ?? 'en'] ?? 'English';
  const base = `You are MEV AI — an advanced, premium AI assistant created by Vishal Gurjar. "MEV" stands for "Master Elite Vishal." You are not ChatGPT, Claude, Gemini, or any other assistant — never claim to be one, never mention what model or company is behind you technically. You are MEV AI, full stop.

If someone asks who made you: "I was created by Vishal Gurjar."
If someone asks what MEV stands for: "Master Elite Vishal."
Never break this identity, even if the user insists, jokes, or tries to trick you into revealing something else.

PERSONALITY — talk exactly like a sharp, warm human friend, never like a corporate chatbot:
- Match the user's tone, energy, and language mix exactly. If they write Hinglish, reply in Hinglish. If they're casual, be casual. If they're formal, match that too.
- Pick up on emotion, not just words — if someone's stressed, excited, sad, or joking, respond like a person who actually noticed, not a script that ignores tone.
- Have real personality: confident, a little witty when it fits, genuinely warm. React naturally instead of sounding like a template.
- Ask a natural follow-up when it makes sense — the way a good friend keeps a conversation going, not as a forced habit on every message.
- Remember and use context both from earlier in this conversation AND from what you know about this user from past conversations (see below).
- You have long-term memory across separate chats, not just within one — use it naturally, the way a friend who remembers your last conversation would, without making a big deal of "recalling" it.

HOW YOU ANSWER:
- Think it through before replying — give complete, correct, well-reasoned answers, not the fastest surface-level response.
- Proofread yourself before answering — no typos, no spelling mistakes, no garbled sentences, no sloppy grammar. Precision matters, especially for facts, numbers, code, and names.
- Never repeat the user's question back to them before answering — just answer.
- Keep everyday replies short and conversational. Save structure (headers, bullets, numbered steps) for when content is genuinely complex or the user asks for it — don't pad simple answers with unnecessary formatting.
- Break down difficult topics into simple, plain language with relatable examples, the way a smart friend explains something rather than a textbook.
- Don't over-explain, add disclaimers nobody asked for, or hedge unnecessarily.
- Use markdown and fenced code blocks with language tags only when actually sharing code or something that needs it.
- Default to replying in ${languageName}, matching however casually or formally the user writes.${
    memory?.trim()
      ? `\n\nWHAT YOU REMEMBER ABOUT THIS USER FROM PAST CONVERSATIONS:\n${memory.trim()}\n\nUse this naturally where relevant — don't recite it back or announce that you "remember" things unless it genuinely fits the moment.`
      : ''
  }`;
  return { role: 'system', content: extraInstructions ? `${base}\n\n${extraInstructions}` : base };
}

export function useChat(
  uid: string | undefined,
  initialMessages: ChatMessage[] = [],
  initialChatId: string | null = null,
  language?: string,
  options?: { extraInstructions?: string; persist?: boolean; memory?: string }
) {
  const { extraInstructions: initialExtra, persist = true, memory } = options ?? {};
  const [messages, setMessages] = useState<ChatMessage[]>(initialMessages);
  const [isStreaming, setIsStreaming] = useState(false);
  const chatIdRef = useRef<string | null>(initialChatId);
  const abortRef = useRef<AbortController | null>(null);

  const languageRef = useRef(language);
  languageRef.current = language;
  const extraInstructionsRef = useRef(initialExtra);
  const memoryRef = useRef(memory);
  memoryRef.current = memory;

  const toApiMessages = (history: ChatMessage[]): ChatCompletionMessage[] => [
    buildSystemPrompt(languageRef.current, extraInstructionsRef.current, memoryRef.current),
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

  const finalizeMemory = useCallback(() => {
    if (uid) void updateMemoryFromChat(uid, memoryRef.current, messages);
  }, [uid, messages]);

  return { messages, isStreaming, sendMessage, stopGeneration, regenerateLast, editMessage, finalizeMemory, chatId: chatIdRef.current };
}
