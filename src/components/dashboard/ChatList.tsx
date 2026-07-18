import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Star, Trash2, MessageSquare, Loader2 } from 'lucide-react';
import GlassCard from '../common/GlassCard';
import { ChatSummary, listChats, toggleSaved, deleteChat } from '../../lib/chatStore';

export default function ChatList({ uid, savedOnly }: { uid: string | undefined; savedOnly: boolean }) {
  const [chats, setChats] = useState<ChatSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    if (!uid) return;
    setLoading(true);
    listChats(uid, savedOnly)
      .then(setChats)
      .finally(() => setLoading(false));
  }, [uid, savedOnly]);

  const handleToggleSave = async (chat: ChatSummary) => {
    await toggleSaved(chat.id, !chat.saved);
    setChats((prev) =>
      savedOnly ? prev.filter((c) => c.id !== chat.id) : prev.map((c) => (c.id === chat.id ? { ...c, saved: !c.saved } : c))
    );
  };

  const handleDelete = async (chat: ChatSummary) => {
    await deleteChat(chat.id);
    setChats((prev) => prev.filter((c) => c.id !== chat.id));
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20 text-ink/30">
        <Loader2 className="animate-spin" size={22} />
      </div>
    );
  }

  if (chats.length === 0) {
    return (
      <GlassCard className="p-10 text-center">
        <p className="text-ink/40 text-sm">
          {savedOnly ? "You haven't saved any chats yet." : 'No conversations yet — start one from AI Chat.'}
        </p>
      </GlassCard>
    );
  }

  return (
    <div className="space-y-3">
      {chats.map((chat) => (
        <GlassCard key={chat.id} className="p-4 flex items-center justify-between gap-4 hover:border-gold/20 transition-colors">
          <button
            onClick={() => navigate(`/dashboard?id=${chat.id}`)}
            className="flex items-center gap-3 flex-1 min-w-0 text-left"
          >
            <div className="w-9 h-9 rounded-lg glass flex items-center justify-center shrink-0">
              <MessageSquare size={15} className="text-gold" />
            </div>
            <div className="min-w-0">
              <p className="text-sm text-paper truncate">{chat.title}</p>
              <p className="text-xs text-ink/30">{new Date(chat.updatedAt).toLocaleString()}</p>
            </div>
          </button>
          <div className="flex items-center gap-1 shrink-0">
            <button
              onClick={() => handleToggleSave(chat)}
              className={`p-2 rounded-lg hover:bg-ink/[0.06] ${chat.saved ? 'text-gold' : 'text-ink/30'}`}
              aria-label="Toggle saved"
            >
              <Star size={16} className={chat.saved ? 'fill-gold' : ''} />
            </button>
            <button onClick={() => handleDelete(chat)} className="p-2 rounded-lg hover:bg-ink/[0.06] text-ink/30 hover:text-red-400" aria-label="Delete chat">
              <Trash2 size={16} />
            </button>
          </div>
        </GlassCard>
      ))}
    </div>
  );
}
