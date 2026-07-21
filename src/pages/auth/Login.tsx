import { useState, FormEvent } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Eye, EyeOff, Loader2 } from 'lucide-react';
import AuthLayout from '../../components/layout/AuthLayout';
import GoogleIcon from '../../components/common/GoogleIcon';
import { useAuth } from '../../context/AuthContext';
import { isValidEmail, friendlyFirebaseError } from '../../utils/validators';
import { isNativeApp } from '../../lib/platform';

interface FirebaseErrorLike {
  code?: string;
}

export default function Login() {
  const { login, loginWithGoogle } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const redirectTo = (location.state as { from?: string } | null)?.from ?? '/dashboard';

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');

    if (!isValidEmail(email)) {
      setError('Please enter a valid email address.');
      return;
    }
    if (password.length === 0) {
      setError('Please enter your password.');
      return;
    }

    setLoading(true);
    try {
      await login(email, password);
      navigate(redirectTo, { replace: true });
    } catch (err) {
      const code = (err as FirebaseErrorLike).code ?? '';
      setError(friendlyFirebaseError(code));
    } finally {
      setLoading(false);
    }
  };

  const handleGoogle = async () => {
    setError('');
    setGoogleLoading(true);
    try {
      await loginWithGoogle();
      navigate(redirectTo, { replace: true });
    } catch (err) {
      const code = (err as FirebaseErrorLike).code ?? '';
      setError(friendlyFirebaseError(code));
    } finally {
      setGoogleLoading(false);
    }
  };

  return (
    <AuthLayout title="Welcome back" subtitle="Log in to continue to MEV AI">
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
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="input-field"
            placeholder="you@example.com"
          />
        </div>

        <div>
          <div className="flex justify-between items-center mb-1.5">
            <label htmlFor="password" className="block text-xs text-ink/50">Password</label>
            <Link to="/forgot-password" className="text-xs text-gold hover:underline">Forgot password?</Link>
          </div>
          <div className="relative">
            <input
              id="password"
              type={showPassword ? 'text' : 'password'}
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="input-field pr-11"
              placeholder="••••••••"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-ink/40 hover:text-ink/70"
              aria-label={showPassword ? 'Hide password' : 'Show password'}
            >
              {showPassword ? <EyeOff size={17} /> : <Eye size={17} />}
            </button>
          </div>
        </div>

        <button type="submit" disabled={loading} className="btn-gold w-full flex items-center justify-center gap-2 disabled:opacity-60">
          {loading && <Loader2 size={16} className="animate-spin" />}
          {loading ? 'Logging in...' : 'Log In'}
        </button>
      </form>

      <div className="flex items-center gap-3 my-6">
        <div className="h-px bg-ink/10 flex-1" />
        <span className="text-ink/30 text-xs">OR</span>
        <div className="h-px bg-ink/10 flex-1" />
      </div>

      {isNativeApp() ? (
        <p className="text-center text-ink/40 text-xs">
          Google Sign-In isn't available in the app yet — please use email &amp; password. (Works fine on the website.)
        </p>
      ) : (
        <button
          onClick={handleGoogle}
          disabled={googleLoading}
          className="btn-ghost w-full flex items-center justify-center gap-3 disabled:opacity-60"
        >
          {googleLoading ? <Loader2 size={16} className="animate-spin" /> : <GoogleIcon />}
          Continue with Google
        </button>
      )}

      <p className="text-center text-ink/40 text-sm mt-8">
        Don't have an account?{' '}
        <Link to="/register" className="text-gold hover:underline">Sign up</Link>
      </p>
    </AuthLayout>
  );
}
