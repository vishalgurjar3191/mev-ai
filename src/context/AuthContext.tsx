import { createContext, useContext, useEffect, useState, ReactNode, useCallback } from 'react';
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut as firebaseSignOut,
  sendPasswordResetEmail,
  onAuthStateChanged,
  updateProfile,
  User,
} from 'firebase/auth';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { auth, db, googleProvider } from '../firebase/config';
import { UserProfile } from '../types';

interface AuthContextValue {
  firebaseUser: User | null;
  profile: UserProfile | null;
  loading: boolean;
  register: (name: string, email: string, password: string) => Promise<void>;
  login: (email: string, password: string) => Promise<void>;
  loginWithGoogle: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  logout: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export type ThemeChoice = 'matte' | 'amoled' | 'light' | 'auto';

let systemThemeListener: ((e: MediaQueryListEvent) => void) | null = null;
let systemThemeMql: MediaQueryList | null = null;

function resolveSystemTheme(): 'matte' | 'light' {
  if (typeof window === 'undefined' || !window.matchMedia) return 'matte';
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'matte' : 'light';
}

function applyThemeClass(resolved: 'matte' | 'amoled' | 'light') {
  document.documentElement.classList.remove('amoled', 'light');
  if (resolved === 'amoled') document.documentElement.classList.add('amoled');
  if (resolved === 'light') document.documentElement.classList.add('light');
}

export function applyTheme(theme: ThemeChoice = 'matte') {
  // Clean up any previous system-theme listener before (re)applying.
  if (systemThemeMql && systemThemeListener) {
    systemThemeMql.removeEventListener('change', systemThemeListener);
    systemThemeMql = null;
    systemThemeListener = null;
  }

  if (theme === 'auto') {
    applyThemeClass(resolveSystemTheme());
    if (typeof window !== 'undefined' && window.matchMedia) {
      systemThemeMql = window.matchMedia('(prefers-color-scheme: dark)');
      systemThemeListener = () => applyThemeClass(resolveSystemTheme());
      systemThemeMql.addEventListener('change', systemThemeListener);
    }
  } else {
    applyThemeClass(theme);
  }
  localStorage.setItem('mev-theme', theme);
}

async function ensureProfileDoc(user: User): Promise<UserProfile> {
  const ref = doc(db, 'users', user.uid);
  const snap = await getDoc(ref);
  if (snap.exists()) {
    return snap.data() as UserProfile;
  }
  const newProfile: UserProfile = {
    uid: user.uid,
    name: user.displayName ?? 'New User',
    email: user.email ?? '',
    avatarUrl: user.photoURL ?? undefined,
    plan: 'free',
    chatsUsedToday: 0,
    chatsResetAt: Date.now(),
    role: 'user',
    banned: false,
    createdAt: Date.now(),
    notificationsEnabled: false,
    language: 'en',
    theme: 'auto',
  };
  await setDoc(ref, { ...newProfile, createdAt: serverTimestamp() });
  return newProfile;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [firebaseUser, setFirebaseUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  const loadProfile = useCallback(async (user: User) => {
    const ref = doc(db, 'users', user.uid);
    const snap = await getDoc(ref);
    const loaded = snap.exists() ? (snap.data() as UserProfile) : await ensureProfileDoc(user);
    setProfile(loaded);
    applyTheme((loaded.theme as ThemeChoice) ?? 'auto');
  }, []);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setFirebaseUser(user);
      if (user) {
        await loadProfile(user);
      } else {
        setProfile(null);
      }
      setLoading(false);
    });
    return unsubscribe;
  }, [loadProfile]);

  const register = async (name: string, email: string, password: string) => {
    const cred = await createUserWithEmailAndPassword(auth, email, password);
    await updateProfile(cred.user, { displayName: name });
    await ensureProfileDoc(cred.user);
    await loadProfile(cred.user);
  };

  const login = async (email: string, password: string) => {
    await signInWithEmailAndPassword(auth, email, password);
  };

  const loginWithGoogle = async () => {
    const cred = await signInWithPopup(auth, googleProvider);
    await ensureProfileDoc(cred.user);
    await loadProfile(cred.user);
  };

  const resetPassword = async (email: string) => {
    await sendPasswordResetEmail(auth, email);
  };

  const logout = async () => {
    await firebaseSignOut(auth);
  };

  const refreshProfile = async () => {
    if (firebaseUser) await loadProfile(firebaseUser);
  };

  return (
    <AuthContext.Provider
      value={{ firebaseUser, profile, loading, register, login, loginWithGoogle, resetPassword, logout, refreshProfile }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within an AuthProvider');
  return ctx;
}

