import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { deleteUser, EmailAuthProvider, reauthenticateWithCredential } from 'firebase/auth';
import { doc, deleteDoc } from 'firebase/firestore';
import { AlertTriangle, Loader2, Check } from 'lucide-react';
import DashboardLayout from '../../components/dashboard/DashboardLayout';
import GlassCard from '../../components/common/GlassCard';
import { useAuth } from '../../context/AuthContext';
import { db } from '../../firebase/config';
import { friendlyFirebaseError } from '../../utils/validators';
import { listPlans } from '../../lib/plans';
import { startRazorpayCheckout } from '../../lib/payments';
import { Plan } from '../../types';

export default function Profile() {
  const { profile, firebaseUser, logout, refreshProfile } = useAuth();
  const navigate = useNavigate();
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const [plans, setPlans] = useState<Plan[]>([]);
  const [showPlans, setShowPlans] = useState(false);
  const [checkoutBusy, setCheckoutBusy] = useState<string | null>(null);
  const [checkoutError, setCheckoutError] = useState('');

  useEffect(() => {
    listPlans().then((all) => setPlans(all.filter((p) => p.active)));
  }, []);

  const handleUpgrade = (plan: Plan) => {
    if (!firebaseUser || plan.priceINR <= 0) return;
    setCheckoutError('');
    setCheckoutBusy(plan.id);
    void startRazorpayCheckout({
      planId: plan.id,
      userName: profile?.name ?? firebaseUser.displayName ?? 'MEV AI user',
      userEmail: profile?.email ?? firebaseUser.email ?? '',
      onSuccess: async () => {
        setCheckoutBusy(null);
        setShowPlans(false);
        await refreshProfile();
      },
      onError: (message) => {
        setCheckoutBusy(null);
        setCheckoutError(message);
      },
    });
  };

  const isPasswordProvider = firebaseUser?.providerData.some((p) => p.providerId === 'password');

  const handleDelete = async () => {
    if (!firebaseUser) return;
    setError('');
    setLoading(true);
    try {
      if (isPasswordProvider) {
        if (!password) {
          setError('Enter your password to confirm.');
          setLoading(false);
          return;
        }
        const credential = EmailAuthProvider.credential(firebaseUser.email ?? '', password);
        await reauthenticateWithCredential(firebaseUser, credential);
      }
      await deleteDoc(doc(db, 'users', firebaseUser.uid));
      await deleteUser(firebaseUser);
      navigate('/', { replace: true });
    } catch (err) {
      const code = (err as { code?: string }).code ?? '';
      setError(friendlyFirebaseError(code) || 'Could not delete account. Try logging in again first.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <DashboardLayout>
      <div className="section-pad max-w-2xl mx-auto">
        <h1 className="font-display font-bold text-2xl text-paper mb-1">Profile</h1>
        <p className="text-ink/50 text-sm mb-8">Manage your account details.</p>

        <GlassCard className="p-6 mb-6 flex items-center gap-5">
          <div className="w-16 h-16 rounded-full bg-gold-gradient flex items-center justify-center text-on-accent text-2xl font-bold shrink-0">
            {profile?.name?.[0]?.toUpperCase() ?? 'U'}
          </div>
          <div className="min-w-0">
            <p className="font-display font-semibold text-lg text-paper truncate">{profile?.name}</p>
            <p className="text-ink/40 text-sm truncate">{profile?.email}</p>
          </div>
        </GlassCard>

        <div className="grid sm:grid-cols-2 gap-6 mb-6">
          <GlassCard className="p-6">
            <p className="text-ink/40 text-xs uppercase tracking-wide mb-2">Subscription</p>
            <p className="font-display font-semibold text-lg text-gold capitalize mb-3">{profile?.plan ?? 'free'}</p>
            {(profile?.plan ?? 'free') === 'free' && plans.some((p) => p.priceINR > 0) && (
              <button onClick={() => setShowPlans((v) => !v)} className="btn-gold text-xs py-1.5 px-4">
                Upgrade
              </button>
            )}
          </GlassCard>
          <GlassCard className="p-6">
            <p className="text-ink/40 text-xs uppercase tracking-wide mb-2">Chats used today</p>
            <p className="font-display font-semibold text-lg text-paper">{profile?.chatsUsedToday ?? 0}</p>
          </GlassCard>
        </div>

        {showPlans && (
          <GlassCard className="p-6 mb-6">
            <p className="text-sm font-medium text-paper mb-4">Choose a plan</p>
            {checkoutError && <p className="text-xs text-red-400 mb-3">{checkoutError}</p>}
            <div className="space-y-3">
              {plans
                .filter((p) => p.priceINR > 0)
                .map((p) => (
                  <div key={p.id} className="flex items-center justify-between gap-3 border border-ink/[0.08] rounded-xl px-4 py-3">
                    <div>
                      <p className="text-sm text-paper font-medium">
                        {p.name} — ₹{p.priceINR}/mo
                      </p>
                      <ul className="text-xs text-ink/40 mt-1 space-y-0.5">
                        {p.features.map((f) => (
                          <li key={f} className="flex items-center gap-1">
                            <Check size={11} className="text-gold" /> {f}
                          </li>
                        ))}
                      </ul>
                    </div>
                    <button onClick={() => handleUpgrade(p)} disabled={checkoutBusy === p.id} className="btn-gold text-xs py-1.5 px-4 shrink-0">
                      {checkoutBusy === p.id ? <Loader2 size={13} className="animate-spin" /> : 'Choose'}
                    </button>
                  </div>
                ))}
            </div>
          </GlassCard>
        )}

        <GlassCard className="p-6 border-red-500/20">
          <div className="flex items-start gap-3 mb-4">
            <AlertTriangle size={18} className="text-red-400 mt-0.5 shrink-0" />
            <div>
              <p className="text-paper font-medium text-sm mb-1">Delete account</p>
              <p className="text-ink/40 text-xs">This permanently deletes your account and all associated data. This cannot be undone.</p>
            </div>
          </div>

          {!confirmOpen ? (
            <button onClick={() => setConfirmOpen(true)} className="text-red-400 text-sm hover:underline">
              Delete my account
            </button>
          ) : (
            <div className="space-y-3">
              {error && <p className="text-red-400 text-xs">{error}</p>}
              {isPasswordProvider && (
                <input
                  type="password"
                  placeholder="Confirm your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="input-field text-sm"
                />
              )}
              <div className="flex gap-3">
                <button onClick={() => setConfirmOpen(false)} className="btn-ghost text-xs py-2 px-4">Cancel</button>
                <button
                  onClick={handleDelete}
                  disabled={loading}
                  className="bg-red-500 text-white text-xs font-medium rounded-full px-4 py-2 flex items-center gap-2 disabled:opacity-60"
                >
                  {loading && <Loader2 size={13} className="animate-spin" />}
                  Permanently Delete
                </button>
              </div>
            </div>
          )}
        </GlassCard>

        <button onClick={() => logout().then(() => navigate('/'))} className="text-ink/30 text-xs mt-6 hover:text-ink/60">
          Log out
        </button>
      </div>
    </DashboardLayout>
  );
}
