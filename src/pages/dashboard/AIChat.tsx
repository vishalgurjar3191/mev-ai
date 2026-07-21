import { useEffect, useState, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Sparkles } from 'lucide-react';
import DashboardLayout from '../../components/dashboard/DashboardLayout';
import ChatMessageBubble from '../../components/chat/ChatMessageBubble';
import ChatComposer from '../../components/chat/ChatComposer';
import { useChat, ChatMessage } from '../../hooks/useChat';
import { useAuth } from '../../context/AuthContext';
import { loadMessages } from '../../lib/chatStore';

const suggestions = [
  'Explain quantum computing simply',
  'Write a Python function to reverse a linked list',
  'Draft a professional follow-up email',
  'Attach a PDF or image using the paperclip, or try Web Search / Generate Image below',
];

export default function AIChat() {
  const { firebaseUser } = useAuth();
  const [searchParams] = useSearchParams();
  const chatIdParam = searchParams.get('id');

  const [initialMessages, setInitialMessages] = useState<ChatMessage[]>([]);
  const [ready, setReady] = useState(!chatIdParam);

  useEffect(() => {
    let cancelled = false;
    if (chatIdParam) {
      setReady(false);
      loadMessages(chatIdParam).then((docs) => {
        if (cancelled) return;
        setInitialMessages(docs.map((d) => ({ id: d.id, role: d.role, content: d.content })));
        setReady(true);
      });
    } else {
      setInitialMessages([]);
      setReady(true);
    }
    return () => {
      cancelled = true;
    };
  }, [chatIdParam]);

  if (!ready) {
    return (
      <DashboardLayout>
        <div className="h-[calc(100vh-65px)] flex items-center justify-center text-ink/30 text-sm">Loading chat...</div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <ChatBody key={chatIdParam ?? 'new'} uid={firebaseUser?.uid} initialMessages={initialMessages} initialChatId={chatIdParam} />
    </DashboardLayout>
  );
}

function ChatBody({
  uid,
  initialMessages,
  initialChatId,
}: {
  uid: string | undefined;
  initialMessages: ChatMessage[];
  initialChatId: string | null;
}) {
  const { profile } = useAuth();
  const { messages, isStreaming, sendMessage, stopGeneration, regenerateLast, editMessage, finalizeMemory } = useChat(
    uid,
    initialMessages,
    initialChatId,
    profile?.language,
    { memory: profile?.memory }
  );

  const finalizeMemoryRef = useRef(finalizeMemory);
  finalizeMemoryRef.current = finalizeMemory;

  useEffect(() => {
    // Saves what MEV AI learned in this chat to the user's long-term memory whenever they
    // leave it (new chat, switch chats, close the app) — this is what makes cross-chat
    // memory work without needing an explicit "save" action from the user.
    return () => finalizeMemoryRef.current();
  }, []);

  useEffect(() => {
    const el = document.getElementById('chat-scroll-area');
    el?.scrollTo({ top: el.scrollHeight, behavior: 'smooth' });
  }, [messages]);

  return (
    <div className="h-[calc(100vh-65px)] flex flex-col">
      <div id="chat-scroll-area" className="flex-1 overflow-y-auto section-pad !py-8 space-y-6">
        {messages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center max-w-lg mx-auto">
            <div className="w-14 h-14 rounded-2xl glass flex items-center justify-center mb-5">
              <Sparkles size={24} className="text-gold" />
            </div>
            <h2 className="font-display font-semibold text-xl text-paper mb-2">How can I help today?</h2>
            <p className="text-ink/40 text-sm mb-8">Chat, attach files, search the web, or generate images — all in one place.</p>
            <div className="grid sm:grid-cols-2 gap-3 w-full">
              {suggestions.map((s) => (
                <button
                  key={s}
                  onClick={() => sendMessage(s)}
                  className="glass rounded-xl px-4 py-3 text-xs text-ink/60 text-left hover:border-ink/30 hover:text-ink/90 transition-colors"
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
          <p className="text-center text-ink/20 text-[11px] mt-2">MEV AI can make mistakes. Verify important information.</p>
        </div>
      </div>
    </div>
  );
}
