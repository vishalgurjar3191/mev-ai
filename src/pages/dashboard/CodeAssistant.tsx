import { useEffect, useRef } from 'react';
import { Code2 } from 'lucide-react';
import DashboardLayout from '../../components/dashboard/DashboardLayout';
import ChatMessageBubble from '../../components/chat/ChatMessageBubble';
import ChatComposer from '../../components/chat/ChatComposer';
import { useAuth } from '../../context/AuthContext';
import { useChat } from '../../hooks/useChat';

const CODE_INSTRUCTIONS =
  'You are acting as a senior software engineer pair-programming with the user. Prioritize correct, working code over long explanations. Always use fenced code blocks with the correct language tag. When fixing bugs, briefly state what was wrong before showing the fix. Ask a clarifying question only if the request is genuinely ambiguous.';

const suggestions = [
  'Write a debounce function in TypeScript',
  'Fix this: for(i=0;i<10;i++){setTimeout(...)}',
  'Explain the difference between useMemo and useCallback',
  'Write a SQL query to find duplicate rows',
];

export default function CodeAssistant() {
  const { firebaseUser, profile } = useAuth();
  const { messages, isStreaming, sendMessage, stopGeneration, regenerateLast, editMessage } = useChat(
    firebaseUser?.uid,
    [],
    null,
    profile?.language,
    { extraInstructions: CODE_INSTRUCTIONS }
  );
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
  }, [messages]);

  return (
    <DashboardLayout>
      <div className="h-[calc(100vh-65px)] flex flex-col">
        <div ref={scrollRef} className="flex-1 overflow-y-auto section-pad !py-8 space-y-6">
          {messages.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center max-w-lg mx-auto">
              <div className="w-14 h-14 rounded-2xl glass flex items-center justify-center mb-5">
                <Code2 size={24} className="text-gold" />
              </div>
              <h2 className="font-display font-semibold text-xl text-paper mb-2">Code Assistant</h2>
              <p className="text-ink/40 text-sm mb-8">Paste code, describe a bug, or ask for a snippet.</p>
              <div className="grid sm:grid-cols-2 gap-3 w-full">
                {suggestions.map((s) => (
                  <button
                    key={s}
                    onClick={() => sendMessage(s)}
                    className="glass rounded-xl px-4 py-3 text-xs text-ink/60 text-left hover:border-gold/30 hover:text-ink/90 transition-colors font-mono"
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <div className="max-w-3xl mx-auto space-y-6">
              {messages.map((m, i) => (
                <ChatMessageBubble
                  key={m.id}
                  message={m}
                  isLast={i === messages.length - 1}
                  isStreaming={isStreaming}
                  onRegenerate={regenerateLast}
                  onEdit={editMessage}
                />
              ))}
            </div>
          )}
        </div>

        <div className="px-4 md:px-8 pb-6 pt-2">
          <div className="max-w-3xl mx-auto">
            <ChatComposer onSend={sendMessage} onStop={stopGeneration} isStreaming={isStreaming} />
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
