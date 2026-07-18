import { useEffect, useState } from 'react';
import { Users, CreditCard, Mic2, Shield, Ban, ShieldCheck, Trash2, Plus, Loader2 } from 'lucide-react';
import DashboardLayout from '../../components/dashboard/DashboardLayout';
import GlassCard from '../../components/common/GlassCard';
import { useAuth } from '../../context/AuthContext';
import { UserProfile, Plan, AdminVoiceConfig } from '../../types';
import { listUsers, setUserBanned, setUserRole, setUserPlan } from '../../lib/adminUsers';
import { listPlans, savePlan, deletePlan, DEFAULT_PLANS } from '../../lib/plans';
import { listAdminVoices, saveAdminVoice, deleteAdminVoice } from '../../lib/adminVoices';
import { REALISTIC_VOICES } from '../../lib/ttsClient';

type Tab = 'users' | 'plans' | 'voices';

export default function Admin() {
  const { profile } = useAuth();
  const [tab, setTab] = useState<Tab>('users');

  if (profile && profile.role !== 'admin') {
    return (
      <DashboardLayout>
        <div className="section-pad">
          <GlassCard className="p-8 text-center max-w-md mx-auto">
            <Shield size={28} className="mx-auto mb-3 text-red-400" />
            <h1 className="font-display font-semibold text-lg text-paper mb-1">Admins only</h1>
            <p className="text-sm text-ink/50">You don't have access to this page.</p>
          </GlassCard>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="section-pad !py-8">
        <h1 className="font-display font-bold text-2xl text-paper mb-1">Admin</h1>
        <p className="text-ink/50 text-sm mb-6">Manage users, pricing plans, and the voice catalog.</p>

        <div className="flex gap-2 mb-6 border-b border-ink/[0.08]">
          {([
            { id: 'users', label: 'Users', icon: Users },
            { id: 'plans', label: 'Plans', icon: CreditCard },
            { id: 'voices', label: 'Voices', icon: Mic2 },
          ] as { id: Tab; label: string; icon: typeof Users }[]).map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => setTab(id)}
              className={`flex items-center gap-1.5 px-4 py-2.5 text-sm border-b-2 -mb-px transition-colors ${
                tab === id ? 'border-gold text-paper' : 'border-transparent text-ink/40 hover:text-ink/70'
              }`}
            >
              <Icon size={14} /> {label}
            </button>
          ))}
        </div>

        {tab === 'users' && <UsersTab />}
        {tab === 'plans' && <PlansTab />}
        {tab === 'voices' && <VoicesTab />}
      </div>
    </DashboardLayout>
  );
}

function UsersTab() {
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [busyUid, setBusyUid] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    setUsers(await listUsers());
    setLoading(false);
  };

  useEffect(() => {
    void load();
  }, []);

  const toggleBan = async (u: UserProfile) => {
    setBusyUid(u.uid);
    await setUserBanned(u.uid, !u.banned);
    setUsers((prev) => prev.map((x) => (x.uid === u.uid ? { ...x, banned: !u.banned } : x)));
    setBusyUid(null);
  };

  const toggleRole = async (u: UserProfile) => {
    const newRole = u.role === 'admin' ? 'user' : 'admin';
    if (!confirm(`Make ${u.name} ${newRole === 'admin' ? 'an admin' : 'a regular user'}?`)) return;
    setBusyUid(u.uid);
    await setUserRole(u.uid, newRole);
    setUsers((prev) => prev.map((x) => (x.uid === u.uid ? { ...x, role: newRole } : x)));
    setBusyUid(null);
  };

  const changePlan = async (u: UserProfile, plan: string) => {
    setBusyUid(u.uid);
    await setUserPlan(u.uid, plan);
    setUsers((prev) => prev.map((x) => (x.uid === u.uid ? { ...x, plan: plan as UserProfile['plan'] } : x)));
    setBusyUid(null);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16 text-ink/40">
        <Loader2 className="animate-spin mr-2" size={18} /> Loading users…
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <p className="text-xs text-ink/40 mb-3">{users.length} users</p>
      {users.map((u) => (
        <GlassCard key={u.uid} className="p-4 flex items-center justify-between gap-3 flex-wrap">
          <div className="min-w-0">
            <p className="text-sm text-paper font-medium truncate">
              {u.name} {u.role === 'admin' && <span className="text-gold text-xs ml-1">(admin)</span>}
              {u.banned && <span className="text-red-400 text-xs ml-1">(banned)</span>}
            </p>
            <p className="text-xs text-ink/40 truncate">{u.email}</p>
            <p className="text-xs text-ink/30 mt-0.5">
              {u.chatsUsedToday ?? 0} chats today · plan: {u.plan}
            </p>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <select
              value={u.plan}
              onChange={(e) => void changePlan(u, e.target.value)}
              disabled={busyUid === u.uid}
              className="bg-ink/[0.05] border border-ink/10 rounded-lg text-xs px-2 py-1.5 text-paper"
            >
              <option value="free">free</option>
              <option value="pro">pro</option>
              <option value="premium">premium</option>
              <option value="business">business</option>
            </select>
            <button
              onClick={() => void toggleRole(u)}
              disabled={busyUid === u.uid}
              className="w-8 h-8 rounded-lg glass flex items-center justify-center text-ink/50 hover:text-gold disabled:opacity-40"
              aria-label="Toggle admin"
            >
              <ShieldCheck size={14} />
            </button>
            <button
              onClick={() => void toggleBan(u)}
              disabled={busyUid === u.uid}
              className={`w-8 h-8 rounded-lg glass flex items-center justify-center disabled:opacity-40 ${u.banned ? 'text-red-400' : 'text-ink/50 hover:text-red-400'}`}
              aria-label="Toggle ban"
            >
              <Ban size={14} />
            </button>
          </div>
        </GlassCard>
      ))}
    </div>
  );
}

function PlansTab() {
  const [plans, setPlans] = useState<Plan[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const load = async () => {
    setLoading(true);
    setPlans(await listPlans());
    setLoading(false);
  };

  useEffect(() => {
    void load();
  }, []);

  const seedDefaults = async () => {
    setSaving(true);
    for (const p of DEFAULT_PLANS) await savePlan(p);
    await load();
    setSaving(false);
  };

  const updateField = (id: string, field: keyof Plan, value: string | number | boolean) => {
    setPlans((prev) => prev.map((p) => (p.id === id ? { ...p, [field]: value } : p)));
  };

  const save = async (plan: Plan) => {
    setSaving(true);
    await savePlan(plan);
    setSaving(false);
  };

  const remove = async (id: string) => {
    if (!confirm('Delete this plan? Users already on it keep their access until you change it manually.')) return;
    await deletePlan(id);
    setPlans((prev) => prev.filter((p) => p.id !== id));
  };

  const addNew = () => {
    const id = prompt('Plan id (short, no spaces, e.g. "pro-yearly")');
    if (!id) return;
    setPlans((prev) => [
      ...prev,
      { id, name: 'New Plan', tier: 'pro', priceINR: 0, chatLimitPerDay: 100, features: [], active: true, sortOrder: prev.length },
    ]);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16 text-ink/40">
        <Loader2 className="animate-spin mr-2" size={18} /> Loading plans…
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {plans.length === 0 && (
        <GlassCard className="p-6 text-center">
          <p className="text-sm text-ink/50 mb-3">No plans set up yet.</p>
          <button onClick={() => void seedDefaults()} disabled={saving} className="btn-gold text-xs py-2 px-5">
            {saving ? 'Creating…' : 'Create default plans (Free / Pro ₹199 / Premium ₹499)'}
          </button>
        </GlassCard>
      )}

      {plans.map((p) => (
        <GlassCard key={p.id} className="p-4">
          <div className="grid sm:grid-cols-2 gap-3 mb-3">
            <div>
              <label className="text-xs text-ink/40 block mb-1">Name</label>
              <input value={p.name} onChange={(e) => updateField(p.id, 'name', e.target.value)} className="input-field text-sm py-2" />
            </div>
            <div>
              <label className="text-xs text-ink/40 block mb-1">Price (₹/month, 0 = free)</label>
              <input
                type="number"
                value={p.priceINR}
                onChange={(e) => updateField(p.id, 'priceINR', Number(e.target.value))}
                className="input-field text-sm py-2"
              />
            </div>
            <div>
              <label className="text-xs text-ink/40 block mb-1">Chat limit/day (blank = unlimited)</label>
              <input
                type="number"
                value={p.chatLimitPerDay ?? ''}
                onChange={(e) => updateField(p.id, 'chatLimitPerDay', e.target.value === '' ? (null as unknown as number) : Number(e.target.value))}
                className="input-field text-sm py-2"
              />
            </div>
            <div>
              <label className="text-xs text-ink/40 block mb-1">Internal tier (used for feature gating)</label>
              <select value={p.tier} onChange={(e) => updateField(p.id, 'tier', e.target.value)} className="input-field text-sm py-2">
                <option value="free">free</option>
                <option value="pro">pro</option>
                <option value="premium">premium</option>
                <option value="business">business</option>
              </select>
            </div>
          </div>
          <div className="mb-3">
            <label className="text-xs text-ink/40 block mb-1">Features (comma separated)</label>
            <input
              value={p.features.join(', ')}
              onChange={(e) => updateField(p.id, 'features', e.target.value.split(',').map((f) => f.trim()).filter(Boolean) as unknown as string)}
              className="input-field text-sm py-2"
            />
          </div>
          <div className="flex items-center justify-between">
            <label className="flex items-center gap-2 text-xs text-ink/50">
              <input type="checkbox" checked={p.active} onChange={(e) => updateField(p.id, 'active', e.target.checked)} />
              Active (visible on pricing page)
            </label>
            <div className="flex gap-2">
              <button onClick={() => remove(p.id)} className="w-8 h-8 rounded-lg glass flex items-center justify-center text-ink/50 hover:text-red-400">
                <Trash2 size={14} />
              </button>
              <button onClick={() => void save(p)} disabled={saving} className="btn-gold text-xs py-1.5 px-4">
                Save
              </button>
            </div>
          </div>
        </GlassCard>
      ))}

      {plans.length > 0 && (
        <button onClick={addNew} className="btn-ghost text-xs py-2 px-4 flex items-center gap-1.5">
          <Plus size={13} /> Add plan
        </button>
      )}

      <p className="text-xs text-ink/30 mt-2">
        Note: checkout (Razorpay) needs the Cloud Functions backend deployed — see ADMIN_SETUP.md in the project root. Without it,
        paid plans will show but the "Upgrade" button won't be able to charge anyone.
      </p>
    </div>
  );
}

function VoicesTab() {
  const [voices, setVoices] = useState<AdminVoiceConfig[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const load = async () => {
    setLoading(true);
    setVoices(await listAdminVoices());
    setLoading(false);
  };

  useEffect(() => {
    void load();
  }, []);

  const addNew = () => {
    setVoices((prev) => [
      ...prev,
      { id: `v-${Date.now()}`, label: 'New Voice', gender: 'female', elevenLabsVoiceId: '', active: true },
    ]);
  };

  const updateField = (id: string, field: keyof AdminVoiceConfig, value: string | boolean) => {
    setVoices((prev) => prev.map((v) => (v.id === id ? { ...v, [field]: value } : v)));
  };

  const save = async (v: AdminVoiceConfig) => {
    if (!v.elevenLabsVoiceId.trim()) {
      alert('ElevenLabs Voice ID is required — find it at elevenlabs.io/app/voice-library, open a voice, copy its Voice ID.');
      return;
    }
    setSaving(true);
    await saveAdminVoice(v);
    setSaving(false);
  };

  const remove = async (id: string) => {
    await deleteAdminVoice(id);
    setVoices((prev) => prev.filter((v) => v.id !== id));
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16 text-ink/40">
        <Loader2 className="animate-spin mr-2" size={18} /> Loading voices…
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <GlassCard className="p-4">
        <p className="text-xs text-ink/40">
          Built-in defaults (always available, can't be edited here): {REALISTIC_VOICES.map((v) => v.label).join(', ')}. Add more
          below — find Voice IDs at{' '}
          <a href="https://elevenlabs.io/app/voice-library" target="_blank" rel="noreferrer" className="text-gold hover:underline">
            elevenlabs.io/app/voice-library
          </a>
          .
        </p>
      </GlassCard>

      {voices.map((v) => (
        <GlassCard key={v.id} className="p-4">
          <div className="grid sm:grid-cols-3 gap-3 mb-3">
            <div>
              <label className="text-xs text-ink/40 block mb-1">Label</label>
              <input value={v.label} onChange={(e) => updateField(v.id, 'label', e.target.value)} className="input-field text-sm py-2" />
            </div>
            <div>
              <label className="text-xs text-ink/40 block mb-1">Gender</label>
              <select value={v.gender} onChange={(e) => updateField(v.id, 'gender', e.target.value)} className="input-field text-sm py-2">
                <option value="female">female</option>
                <option value="male">male</option>
              </select>
            </div>
            <div>
              <label className="text-xs text-ink/40 block mb-1">ElevenLabs Voice ID</label>
              <input
                value={v.elevenLabsVoiceId}
                onChange={(e) => updateField(v.id, 'elevenLabsVoiceId', e.target.value)}
                className="input-field text-sm py-2"
                placeholder="e.g. 21m00Tcm4TlvDq8ikWAM"
              />
            </div>
          </div>
          <div className="flex items-center justify-between">
            <label className="flex items-center gap-2 text-xs text-ink/50">
              <input type="checkbox" checked={v.active} onChange={(e) => updateField(v.id, 'active', e.target.checked)} />
              Active
            </label>
            <div className="flex gap-2">
              <button onClick={() => remove(v.id)} className="w-8 h-8 rounded-lg glass flex items-center justify-center text-ink/50 hover:text-red-400">
                <Trash2 size={14} />
              </button>
              <button onClick={() => void save(v)} disabled={saving} className="btn-gold text-xs py-1.5 px-4">
                Save
              </button>
            </div>
          </div>
        </GlassCard>
      ))}

      <button onClick={addNew} className="btn-ghost text-xs py-2 px-4 flex items-center gap-1.5">
        <Plus size={13} /> Add voice
      </button>
    </div>
  );
}
