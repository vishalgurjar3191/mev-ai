import { useEffect, useState } from 'react';

/**
 * Boot splash shown for a moment every time the app is opened, so the brand identity
 * (MEV AI, by Vishal Gurjar) is the very first thing a user sees — before landing page,
 * login, or dashboard render.
 */
export default function SplashScreen({ onDone }: { onDone: () => void }) {
  const [leaving, setLeaving] = useState(false);

  useEffect(() => {
    const leaveTimer = setTimeout(() => setLeaving(true), 900);
    const doneTimer = setTimeout(onDone, 1250);
    return () => {
      clearTimeout(leaveTimer);
      clearTimeout(doneTimer);
    };
  }, [onDone]);

  return (
    <div
      className={`fixed inset-0 z-[100] flex flex-col items-center justify-center bg-obsidian transition-opacity duration-300 ${
        leaving ? 'opacity-0 pointer-events-none' : 'opacity-100'
      }`}
    >
      <div className="w-16 h-16 rounded-2xl bg-gold-gradient flex items-center justify-center shadow-gold-glow mb-5 animate-pulse">
        <span className="text-on-accent font-display font-bold text-2xl">M</span>
      </div>
      <h1 className="font-display font-bold text-2xl gold-text tracking-tight">MEV AI</h1>
      <p className="text-ink/40 text-xs mt-2 tracking-widest uppercase">by Vishal Gurjar</p>
    </div>
  );
}
