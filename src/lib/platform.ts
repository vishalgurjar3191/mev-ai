/**
 * Detects whether the app is running inside the Capacitor-wrapped native app (Android/iOS)
 * vs a regular browser. Deliberately doesn't import @capacitor/core (it's not a dependency of
 * this web project — Capacitor gets added separately when you wrap it for the app build), so
 * this reads Capacitor's runtime-injected global instead. Returns false safely on the web.
 */
export function isNativeApp(): boolean {
  if (typeof window === 'undefined') return false;
  const cap = (window as unknown as { Capacitor?: { isNativePlatform?: () => boolean } }).Capacitor;
  return !!cap?.isNativePlatform?.();
}
