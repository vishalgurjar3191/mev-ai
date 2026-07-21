import { useEffect, useState, FormEvent } from 'react';
import { doc, updateDoc } from 'firebase/firestore';
import { EmailAuthProvider, reauthenticateWithCredential, updatePassword } from 'firebase/auth';
import { Download, Loader2, Check, Sun, Moon, MoonStar, Monitor, Volume2, Play } from 'lucide-react';
import DashboardLayout from '../../components/dashboard/DashboardLayout';
import GlassCard from '../../components/common/GlassCard';
import { useAuth, applyTheme, ThemeChoice } from '../../context/AuthContext';
import { db } from '../../firebase/config';
import { listChats } from '../../lib/chatStore';
import { friendlyFirebaseError, passwordStrength } from '../../utils/validators';
import { REALISTIC_VOICES, hasElevenLabsKey, speakRealistic, RealisticVoice } from '../../lib/ttsClient';
import { listAdminVoices } from '../../lib/adminVoices';

type ThemeOption = ThemeChoice;
const THEME_OPTIONS: { value: ThemeOption; label: string; icon: typeof Sun }[] = [
  { value: 'auto', label: 'Auto', icon: Monitor },
  { value: 'light', label: 'Light', icon: Sun },
  { value: 'matte', label: 'Dark', icon: Moon },
  { value: 'amoled', label: 'AMOLED', icon: MoonStar },
];

const LANGUAGES = [
  { code: 'en', label: 'English' },
  { code: 'hi', label: 'Hindi' },
  { code: 'es', label: 'Spanish' },
  { code: 'fr', label: 'French' },
  { code: 'de', label: 'German' },
  { code: 'ja', label: 'Japanese' },
];

function ToggleRow({ label, description, checked, onChange }: { label: string; description: string; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <div className="flex items-center justify-between py-4 border-b border-ink/[0.06] last:border-0">
      <div className="pr-4">
        <p className="text-sm text-paper">{label}</p>
        <p className="text-xs text-ink/40 mt-0.5">{description}</p>
      </div>
      <button
        onClick={() => onChange(!checked)}
        className={`shrink-0 w-11 h-6 rounded-full transition-colors relative ${checked ? 'bg-gold' : 'bg-ink/10'}`}
        role="switch"
        aria-checked={checked}
      >
        <span className={`absolute top-0.5 w-5 h-5 rounded-full bg-obsidian transition-all ${checked ? 'left-[22px]' : 'left-0.5'}`} />
      </button>
    </div>
  );
}

export default function Settings() {
  const { profile, firebaseUser, refreshProfile } = useAuth();
  const [theme, setTheme] = useState<ThemeOption>('matte');
  const [notifications, setNotifications] = useState(false);
  const [language, setLanguage] = useState('en');
  const [saved, setSaved] = useState(false);

  const [realisticVoices, setRealisticVoices] = useState<RealisticVoice[]>(REALISTIC_VOICES);
  const [selectedVoice, setSelectedVoice] = useState<string>('');
  const [previewingVoice, setPreviewingVoice] = useState<string>('');

  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [pwError, setPwError] = useState('');
  const [pwSuccess, setPwSuccess] = useState(false);
  const [pwLoading, setPwLoading] = useState(false);

  const [exporting, setExporting] = useState(false);

  useEffect(() => {
    if (profile) {
      setTheme((profile.theme as ThemeOption) ?? 'matte');
      setNotifications(!!profile.notificationsEnabled);
      setLanguage(profile.language ?? 'en');
      try {
        const parsed = profile.preferredVoice ? (JSON.parse(profile.preferredVoice) as { id?: string }) : null;
        setSelectedVoice(parsed?.id ?? '');
      } catch {
        setSelectedVoice('');
      }
    }
  }, [profile]);

  useEffect(() => {
    listAdminVoices().then((admin) => {
      const adminAsRealistic: RealisticVoice[] = admin.map((v) => ({ id: v.id, label: v.label, gender: v.gender, elevenLabsVoiceId: v.elevenLabsVoiceId }));
      setRealisticVoices([...REALISTIC_VOICES, ...adminAsRealistic]);
    });
  }, []);

  const handleRealisticSelect = (v: RealisticVoice) => {
    setSelectedVoice(v.id);
    void persist({ preferredVoice: JSON.stringify({ id: v.id, label: v.label, gender: v.gender, elevenLabsVoiceId: v.elevenLabsVoiceId }) });
  };

  const handleRealisticPreview = (v: RealisticVoice) => {
    setPreviewingVoice(v.id);
    speakRealistic('Hi, this is how I sound. Let me know if you like this voice.', v.elevenLabsVoiceId, () => setPreviewingVoice(''))
      .catch(() => setPreviewingVoice(''));
  };

  const persist = async (updates: Partial<{ theme: string; notificationsEnabled: boolean; language: string; preferredVoice: string }>) => {
    if (!firebaseUser) return;
    await updateDoc(doc(db, 'users', firebaseUser.uid), updates);
    await refreshProfile();
    setSaved(true);
    setTimeout(() => setSaved(false), 1500);
  };

  const handleThemeChange = (v: ThemeOption) => {
    setTheme(v);
    applyTheme(v);
    void persist({ theme: v });
  };

  const handleNotifications = async (v: boolean) => {
    setNotifications(v);
    if (v && 'Notification' in window) {
      const permission = await Notification.requestPermission();
      if (permission !== 'granted') {
        setNotifications(false);
        return;
      }
    }
    void persist({ notificationsEnabled: v });
  };

  const handleLanguage = (code: string) => {
    setLanguage(code);
    void persist({ language: code });
  };

  const isPasswordProvider = firebaseUser?.providerData.some((p) => p.providerId === 'password');

  const handlePasswordChange = async (e: FormEvent) => {
    e.preventDefault();
    setPwError('');
    setPwSuccess(false);

    const strength = passwordStrength(newPassword);
    if (!strength.valid) {
      setPwError(strength.message ?? 'Password is too weak.');
      return;
    }
    if (!firebaseUser?.email) return;

    setPwLoading(true);
    try {
      const credential = EmailAuthProvider.credential(firebaseUser.email, oldPassword);
      await reauthenticateWithCredential(firebaseUser, credential);
      await updatePassword(firebaseUser, newPassword);
      setPwSuccess(true);
      setOldPassword('');
      setNewPassword('');
    } catch (err) {
      const code = (err as { code?: string }).code ?? '';
      setPwError(friendlyFirebaseError(code));
    } finally {
      setPwLoading(false);
    }
  };

  const handleExportData = async () => {
    if (!firebaseUser) return;
    setExporting(true);
    try {
      const chats = await listChats(firebaseUser.uid);
      const payload = {
        profile,
        chats: chats.map((c) => ({ title: c.title, updatedAt: new Date(c.updatedAt).toISOString(), saved: c.saved })),
        exportedAt: new Date().toISOString(),
      };
      const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'mev-ai-my-data.json';
      a.click();
      URL.revokeObjectURL(url);
    } finally {
      setExporting(false);
    }
  };

  return (
    <DashboardLayout>
      <div className="section-pad max-w-2xl mx-auto">
        <div className="flex items-center justify-between mb-1">
          <h1 className="font-display font-bold text-2xl text-paper">Settings</h1>
          {saved && <span className="text-xs text-emerald-400 flex items-center gap-1"><Check size={13} /> Saved</span>}
        </div>
        <p className="text-ink/50 text-sm mb-8">Control how MEV AI looks, talks, and notifies you.</p>

        <GlassCard className="p-6 mb-6">
          <h2 className="text-sm font-medium text-ink/50 uppercase tracking-wide mb-3">Appearance</h2>
          <div className="grid grid-cols-4 gap-2">
            {THEME_OPTIONS.map(({ value, label, icon: Icon }) => (
              <button
                key={value}
                onClick={() => handleThemeChange(value)}
                className={`flex flex-col items-center gap-1.5 py-3 rounded-xl border transition-colors ${
                  theme === value ? 'border-gold/50 bg-gold/10 text-paper' : 'border-ink/[0.06] text-ink/50 hover:bg-ink/[0.04]'
                }`}
              >
                <Icon size={16} />
                <span className="text-xs">{label}</span>
              </button>
            ))}
          </div>
          <p className="text-xs text-ink/40 mt-3">Auto follows your phone's system dark/light setting automatically. AMOLED gives a pure black background for OLED screens.</p>
        </GlassCard>

        <GlassCard className="p-6 mb-6">
          {hasElevenLabsKey() ? (
            <>
              <h2 className="text-sm font-medium text-ink/50 uppercase tracking-wide mb-1">Realistic Voice</h2>
              <p className="text-xs text-ink/40 mb-4">Human-sounding voices powered by ElevenLabs. Pick one to use everywhere replies are read aloud.</p>
              <div className="space-y-4">
                {(['female', 'male'] as const).map((gender) => (
                  <div key={gender}>
                    <p className="text-xs text-ink/40 uppercase tracking-wide mb-2">{gender === 'female' ? 'Female' : 'Male'}</p>
                    <div className="space-y-2">
                      {realisticVoices.filter((v) => v.gender === gender).map((v) => (
                        <div
                          key={v.id}
                          className={`flex items-center justify-between gap-3 rounded-xl px-3 py-2.5 border transition-colors ${
                            selectedVoice === v.id ? 'border-gold/50 bg-gold/10' : 'border-ink/[0.06] hover:bg-ink/[0.04]'
                          }`}
                        >
                          <button onClick={() => handleRealisticSelect(v)} className="flex-1 text-left text-sm text-paper truncate">
                            {v.label}
                          </button>
                          <button
                            onClick={() => handleRealisticPreview(v)}
                            className="shrink-0 w-8 h-8 rounded-lg glass flex items-center justify-center text-ink/50 hover:text-gold"
                            aria-label={`Preview ${v.label}`}
                          >
                            {previewingVoice === v.id ? <Volume2 size={14} className="animate-pulse" /> : <Play size={13} />}
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <>
              <h2 className="text-sm font-medium text-ink/50 uppercase tracking-wide mb-1">Voice</h2>
              <p className="text-xs text-ink/40">
                Voice replies aren't set up yet. Ask the app admin to add a free ElevenLabs API key as{' '}
                <code className="text-gold">VITE_ELEVENLABS_API_KEY</code> — free tier: ~10,000 characters/month, no card needed.
                Get a key at <span className="text-gold">elevenlabs.io</span>.
              </p>
            </>
          )}
        </GlassCard>

        <GlassCard className="p-6 mb-6">
          <h2 className="text-sm font-medium text-ink/50 uppercase tracking-wide mb-3">Language</h2>
          <p className="text-xs text-ink/40 mb-3">MEV AI will reply to you in this language across AI Chat.</p>
          <select value={language} onChange={(e) => handleLanguage(e.target.value)} className="input-field text-sm">
            {LANGUAGES.map((l) => (
              <option key={l.code} value={l.code} className="bg-obsidian">
                {l.label}
              </option>
            ))}
          </select>
        </GlassCard>

        <GlassCard className="p-6 mb-6">
          <h2 className="text-sm font-medium text-ink/50 uppercase tracking-wide mb-2">Notifications</h2>
          <ToggleRow
            label="Push notifications"
            description="Get notified about announcements, replies and usage limits."
            checked={notifications}
            onChange={handleNotifications}
          />
        </GlassCard>

        <GlassCard className="p-6 mb-6">
          <h2 className="text-sm font-medium text-ink/50 uppercase tracking-wide mb-3">Privacy</h2>
          <p className="text-xs text-ink/40 mb-4">Download a copy of your profile and chat titles stored by MEV AI.</p>
          <button onClick={handleExportData} disabled={exporting} className="btn-ghost text-sm flex items-center gap-2 disabled:opacity-60">
            {exporting ? <Loader2 size={15} className="animate-spin" /> : <Download size={15} />}
            Download my data
          </button>
        </GlassCard>

        {isPasswordProvider && (
          <GlassCard className="p-6">
            <h2 className="text-sm font-medium text-ink/50 uppercase tracking-wide mb-3">Security</h2>
            <form onSubmit={handlePasswordChange} className="space-y-3">
              {pwError && <p className="text-red-400 text-xs">{pwError}</p>}
              {pwSuccess && <p className="text-emerald-400 text-xs flex items-center gap-1"><Check size={12} /> Password updated</p>}
              <input
                type="password"
                placeholder="Current password"
                value={oldPassword}
                onChange={(e) => setOldPassword(e.target.value)}
                className="input-field text-sm"
              />
              <input
                type="password"
                placeholder="New password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="input-field text-sm"
              />
              <button type="submit" disabled={pwLoading} className="btn-gold text-sm py-2.5 px-5 flex items-center gap-2 disabled:opacity-60">
                {pwLoading && <Loader2 size={14} className="animate-spin" />}
                Update Password
              </button>
            </form>
          </GlassCard>
        )}
      </div>
    </DashboardLayout>
  );
}
