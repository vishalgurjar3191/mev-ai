import { useState, FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Eye, EyeOff, Loader2, Check, X } from 'lucide-react';
import AuthLayout from '../../components/layout/AuthLayout';
import GoogleIcon from '../../components/common/GoogleIcon';
import { useAuth } from '../../context/AuthContext';
import { isValidEmail, passwordStrength, friendlyFirebaseError, sanitizeInput } from '../../utils/validators';
import { AuthFormErrors } from '../../types';
import { isNativeApp } from '../../lib/platform';

interface FirebaseErrorLike {
  code?: string;
}

export default function Register() {
  const { register, loginWithGoogle } = useAuth();
  const navigate = useNavigate();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [agreed, setAgreed] = useState(false);
  const [errors, setErrors] = useState<AuthFormErrors>({});
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);

  const strength = passwordStrength(password);

  const validate = (): boolean => {
    const next: AuthFormErrors = {};
    if (name.trim().length < 2) next.name = 'Enter your full name.';
    if (!isValidEmail(email)) next.email = 'Enter a valid email address.';
    if (!strength.valid) next.password = strength.message;
    if (password !== confirmPassword) next.confirmPassword = 'Passwords do not match.';
    if (!agreed) next.general = 'Please agree to the Terms of Service to continue.';
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setLoading(true);
    try {
      await register(sanitizeInput(name), email.trim(), password);
      navigate('/dashboard', { replace: true });
    } catch (err) {
      const code = (err as FirebaseErrorLike).code ?? '';
      setErrors({ general: friendlyFirebaseError(code) });
    } finally {
      setLoading(false);
    }
  };

  const handleGoogle = async () => {
    setErrors({});
    setGoogleLoading(true);
    try {
      await loginWithGoogle();
      navigate('/dashboard', { replace: true });
    } catch (err) {
      const code = (err as FirebaseErrorLike).code ?? '';
      setErrors({ general: friendlyFirebaseError(code) });
    } finally {
      setGoogleLoading(false);
    }
  };

  return (
    <AuthLayout title="Create your account" subtitle="Start free — no credit card required">
      <form onSubmit={handleSubmit} noValidate className="space-y-4">
        {errors.general && (
          <div role="alert" className="text-sm text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg px-4 py-2.5">
            {errors.general}
          </div>
        )}

        <div>
          <label htmlFor="name" className="block text-xs text-ink/50 mb-1.5">Full name</label>
          <input id="name" type="text" value={name} onChange={(e) => setName(e.target.value)} className="input-field" placeholder="Riya Sharma" />
          {errors.name && <p className="text-red-400 text-xs mt-1">{errors.name}</p>}
        </div>

        <div>
          <label htmlFor="email" className="block text-xs text-ink/50 mb-1.5">Email</label>
          <input id="email" type="email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} className="input-field" placeholder="you@example.com" />
          {errors.email && <p className="text-red-400 text-xs mt-1">{errors.email}</p>}
        </div>

        <div>
          <label htmlFor="password" className="block text-xs text-ink/50 mb-1.5">Password</label>
          <div className="relative">
            <input
              id="password"
              type={showPassword ? 'text' : 'password'}
              autoComplete="new-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="input-field pr-11"
              placeholder="••••••••"
            />
            <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-ink/40 hover:text-ink/70" aria-label="Toggle password visibility">
              {showPassword ? <EyeOff size={17} /> : <Eye size={17} />}
            </button>
          </div>
          {password.length > 0 && (
            <p className={`text-xs mt-1 flex items-center gap-1 ${strength.valid ? 'text-emerald-400' : 'text-ink/40'}`}>
              {strength.valid ? <Check size={13} /> : <X size={13} />}
              {strength.valid ? 'Strong password' : strength.message}
            </p>
          )}
        </div>

        <div>
          <label htmlFor="confirmPassword" className="block text-xs text-ink/50 mb-1.5">Confirm password</label>
          <input
            id="confirmPassword"
            type={showPassword ? 'text' : 'password'}
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            className="input-field"
            placeholder="••••••••"
          />
          {errors.confirmPassword && <p className="text-red-400 text-xs mt-1">{errors.confirmPassword}</p>}
        </div>

        <label className="flex items-start gap-2.5 text-xs text-ink/50 cursor-pointer">
          <input type="checkbox" checked={agreed} onChange={(e) => setAgreed(e.target.checked)} className="mt-0.5 accent-gold" />
          <span>I agree to the <a href="#" className="text-gold hover:underline">Terms of Service</a> and <a href="#" className="text-gold hover:underline">Privacy Policy</a>.</span>
        </label>

        <button type="submit" disabled={loading} className="btn-gold w-full flex items-center justify-center gap-2 disabled:opacity-60">
          {loading && <Loader2 size={16} className="animate-spin" />}
          {loading ? 'Creating account...' : 'Create Account'}
        </button>
      </form>

      <div className="flex items-center gap-3 my-6">
        <div className="h-px bg-ink/10 flex-1" />
        <span className="text-ink/30 text-xs">OR</span>
        <div className="h-px bg-ink/10 flex-1" />
      </div>

      {isNativeApp() ? (
        <p className="text-center text-ink/40 text-xs">
          Google Sign-Up isn't available in the app yet — please use email &amp; password. (Works fine on the website.)
        </p>
      ) : (
        <button onClick={handleGoogle} disabled={googleLoading} className="btn-ghost w-full flex items-center justify-center gap-3 disabled:opacity-60">
          {googleLoading ? <Loader2 size={16} className="animate-spin" /> : <GoogleIcon />}
          Continue with Google
        </button>
      )}

      <p className="text-center text-ink/40 text-sm mt-8">
        Already have an account? <Link to="/login" className="text-gold hover:underline">Log in</Link>
      </p>
    </AuthLayout>
  );
}
