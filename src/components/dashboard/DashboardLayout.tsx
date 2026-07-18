import { useState, ReactNode } from 'react';
import { Menu, LogOut } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import Sidebar from './Sidebar';
import { useAuth } from '../../context/AuthContext';

export default function DashboardLayout({ children }: { children: ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { profile, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/', { replace: true });
  };

  return (
    <div className="min-h-screen flex bg-obsidian">
      <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <div className="flex-1 flex flex-col min-w-0">
        <header className="flex items-center justify-between px-4 md:px-8 py-4 border-b border-ink/[0.06] glass sticky top-0 z-30">
          <button onClick={() => setSidebarOpen(true)} className="md:hidden text-ink/60" aria-label="Open menu">
            <Menu size={22} />
          </button>
          <div className="hidden md:block" />
          <div className="flex items-center gap-3">
            <span className="text-xs text-ink/40 hidden sm:inline capitalize">{profile?.plan ?? 'free'} plan</span>
            <div className="w-8 h-8 rounded-full bg-gold-gradient flex items-center justify-center text-on-accent text-xs font-bold">
              {profile?.name?.[0]?.toUpperCase() ?? 'U'}
            </div>
            <button onClick={handleLogout} className="text-ink/40 hover:text-gold" aria-label="Log out">
              <LogOut size={17} />
            </button>
          </div>
        </header>

        <main className="flex-1 min-w-0">{children}</main>
      </div>
    </div>
  );
}
