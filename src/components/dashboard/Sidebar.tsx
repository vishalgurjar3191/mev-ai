import { NavLink, useNavigate } from 'react-router-dom';
import { History, Star, User, Settings, X, Plus, Mic, Shield } from 'lucide-react';
import Logo from '../common/Logo';
import { useAuth } from '../../context/AuthContext';

interface NavItem {
  label: string;
  to: string;
  icon: typeof History;
}

const mainNav: NavItem[] = [{ label: 'Voice Chat', to: '/dashboard/voice', icon: Mic }];

const libraryNav: NavItem[] = [
  { label: 'Chat History', to: '/dashboard/history', icon: History },
  { label: 'Saved Chats', to: '/dashboard/saved', icon: Star },
];

const accountNav: NavItem[] = [
  { label: 'Profile', to: '/dashboard/profile', icon: User },
  { label: 'Settings', to: '/dashboard/settings', icon: Settings },
];

function NavGroup({ label, items, onNavigate }: { label: string; items: NavItem[]; onNavigate: () => void }) {
  return (
    <div className="mb-6">
      <p className="text-ink/30 text-[11px] uppercase tracking-wide font-medium px-3 mb-2">{label}</p>
      <div className="space-y-1">
        {items.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            onClick={onNavigate}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-colors ${
                isActive ? 'bg-gold/10 text-gold border border-gold/20' : 'text-ink/60 hover:text-paper hover:bg-ink/[0.04]'
              }`
            }
          >
            <item.icon size={17} />
            {item.label}
          </NavLink>
        ))}
      </div>
    </div>
  );
}

export default function Sidebar({ open, onClose }: { open: boolean; onClose: () => void }) {
  const navigate = useNavigate();
  const { profile } = useAuth();

  return (
    <>
      {open && <div className="fixed inset-0 bg-black/60 z-40 md:hidden" onClick={onClose} />}
      <aside
        className={`fixed md:sticky top-0 h-screen w-72 glass border-r border-ink/[0.06] z-50 md:z-0 flex flex-col transition-transform duration-300 ${
          open ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
        }`}
      >
        <div className="flex items-center justify-between px-5 py-5">
          <Logo size={30} />
          <button onClick={onClose} className="md:hidden text-ink/50" aria-label="Close menu">
            <X size={20} />
          </button>
        </div>

        <div className="px-3 mb-4">
          <button
            onClick={() => {
              navigate('/dashboard');
              onClose();
            }}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-on-accent bg-gold font-medium hover:bg-gold-bright transition-colors"
          >
            <Plus size={17} /> New Chat
          </button>
        </div>

        <nav className="flex-1 overflow-y-auto px-3 py-2">
          <NavGroup label="Talk" items={mainNav} onNavigate={onClose} />
          <NavGroup label="Library" items={libraryNav} onNavigate={onClose} />
          <NavGroup label="Account" items={accountNav} onNavigate={onClose} />
          {profile?.role === 'admin' && (
            <NavGroup label="Admin" items={[{ label: 'Admin Panel', to: '/dashboard/admin', icon: Shield }]} onNavigate={onClose} />
          )}
        </nav>

        <div className="px-5 py-4 border-t border-ink/[0.06]">
          <p className="text-ink/25 text-xs">MEV AI — Intelligence Without Limits</p>
        </div>
      </aside>
    </>
  );
}
