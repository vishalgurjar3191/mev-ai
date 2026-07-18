export function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
}

export function passwordStrength(password: string): { valid: boolean; message?: string } {
  if (password.length < 8) return { valid: false, message: 'Password must be at least 8 characters.' };
  if (!/[A-Z]/.test(password)) return { valid: false, message: 'Add at least one uppercase letter.' };
  if (!/[0-9]/.test(password)) return { valid: false, message: 'Add at least one number.' };
  return { valid: true };
}

// Basic sanitizer to strip characters commonly used in XSS payloads from free-text inputs
// before they are persisted or rendered. This is defense-in-depth alongside React's
// built-in escaping and Firestore security rules — not a replacement for either.
export function sanitizeInput(value: string): string {
  return value
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .trim();
}

export function friendlyFirebaseError(code: string): string {
  const map: Record<string, string> = {
    'auth/email-already-in-use': 'An account with this email already exists.',
    'auth/invalid-email': 'That email address looks invalid.',
    'auth/user-not-found': 'No account found with this email.',
    'auth/wrong-password': 'Incorrect password. Try again.',
    'auth/invalid-credential': 'Incorrect email or password.',
    'auth/too-many-requests': 'Too many attempts. Please wait a moment and try again.',
    'auth/popup-closed-by-user': 'Google sign-in was closed before completing.',
    'auth/weak-password': 'Password is too weak. Use at least 8 characters.',
    'auth/network-request-failed': 'Network error. Check your connection and try again.',
  };
  return map[code] ?? 'Something went wrong. Please try again.';
}
