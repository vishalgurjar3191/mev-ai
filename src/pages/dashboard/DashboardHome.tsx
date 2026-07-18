import { useNavigate } from 'react-router-dom';
import { MessageSquare, History, Star, ArrowRight } from 'lucide-react';
import DashboardLayout from '../../components/dashboard/DashboardLayout';
import GlassCard from '../../components/common/GlassCard';
import { useAuth } from '../../context/AuthContext';

export default function DashboardHome() {
  const { profile } = useAuth();
  const navigate = useNavigate();

  const quickLinks = [
    { label: 'Start a new chat', desc: 'Ask anything, get instant answers', icon: MessageSquare, to: '/dashboard/chat' },
    { label: 'Chat History', desc: 'Pick up a past conversation', icon: History, to: '/dashboard/history' },
    { label: 'Saved Chats', desc: 'Your starred conversations', icon: Star, to: '/dashboard/saved' },
  ];

  return (
    <DashboardLayout>
      <div className="section-pad max-w-4xl mx-auto">
        <h1 className="font-display font-bold text-2xl text-paper mb-1">
          Welcome back{profile?.name ? `, ${profile.name.split(' ')[0]}` : ''} 👋
        </h1>
        <p className="text-ink/50 text-sm mb-10">Here's a quick look at your account.</p>

        <div className="grid sm:grid-cols-3 gap-6 mb-10">
          <GlassCard className="p-6">
            <p className="text-ink/40 text-xs uppercase tracking-wide mb-2">Plan</p>
            <p className="font-display font-semibold text-lg text-gold capitalize">{profile?.plan ?? 'free'}</p>
          </GlassCard>
          <GlassCard className="p-6">
            <p className="text-ink/40 text-xs uppercase tracking-wide mb-2">Chats used today</p>
            <p className="font-display font-semibold text-lg text-paper">{profile?.chatsUsedToday ?? 0}</p>
          </GlassCard>
          <GlassCard className="p-6">
            <p className="text-ink/40 text-xs uppercase tracking-wide mb-2">Email</p>
            <p className="font-display font-semibold text-sm text-paper truncate">{profile?.email}</p>
          </GlassCard>
        </div>

        <div className="grid sm:grid-cols-3 gap-6">
          {quickLinks.map((link) => (
            <button key={link.to} onClick={() => navigate(link.to)} className="text-left">
              <GlassCard className="p-6 h-full hover:border-gold/30 transition-colors group">
                <div className="w-10 h-10 rounded-xl glass flex items-center justify-center mb-4 group-hover:bg-gold/10 transition-colors">
                  <link.icon size={18} className="text-gold" />
                </div>
                <p className="font-display font-semibold text-sm text-paper mb-1 flex items-center gap-1.5">
                  {link.label}
                  <ArrowRight size={13} className="opacity-0 group-hover:opacity-100 transition-opacity" />
                </p>
                <p className="text-ink/40 text-xs">{link.desc}</p>
              </GlassCard>
            </button>
          ))}
        </div>
      </div>
    </DashboardLayout>
  );
}
