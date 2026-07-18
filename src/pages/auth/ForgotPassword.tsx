import { useState, FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { Loader2, MailCheck } from 'lucide-react';
import AuthLayout from '../../components/layout/AuthLayout';
import { useAuth } from '../../context/AuthContext';
import { isValidEmail, friendlyFirebaseError } from '../../utils/validators';

interface FirebaseErrorLike {
  code?: string;
}

export default function ForgotPassword() {
  const { resetPassword } = useAuth();
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');

    if (!isValidEmail(email)) {
      setError('Please enter a valid email address.');
      return;
    }

    setLoading(true);
    try {
      await resetPassword(email);
      setSent(true);
    } catch (err) {
      const code = (err as FirebaseErrorLike).code ?? '';
      setError(friendlyFirebaseError(code));
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout title="Reset your password" subtitle="We'll email you a link to get back in">
      {sent ? (
        <div className="text-center py-4">
          <div className="w-14 h-14 rounded-full glass flex items-center justify-center mx-auto mb-4">
            <MailCheck size={24} className="text-gold" />
          </div>
          <p className="text-ink/70 text-sm mb-1">Check your inbox</p>
          <p className="text-ink/40 text-xs">
            We sent a password reset link to <span className="text-ink/70">{email}</span>.
          </p>
        </div>
      ) : (
        <form onSubmit={handleSubmit} noValidate className="space-y-4">
          {error && (
            <div role="alert" className="text-sm text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg px-4 py-2.5">
              {error}
            </div>
          )}
          <div>
            <label htmlFor="email" className="block text-xs text-ink/50 mb-1.5">Email</label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="input-field"
              placeholder="you@example.com"
            />
          </div>
          <button type="submit" disabled={loading} className="btn-gold w-full flex items-center justify-center gap-2 disabled:opacity-60">
            {loading && <Loader2 size={16} className="animate-spin" />}
            {loading ? 'Sending...' : 'Send Reset Link'}
          </button>
        </form>
      )}

      <p className="text-center text-ink/40 text-sm mt-8">
        Remembered your password? <Link to="/login" className="text-gold hover:underline">Log in</Link>
      </p>
    </AuthLayout>
  );
}
