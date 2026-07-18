interface LogoProps {
  size?: number;
  withWordmark?: boolean;
  className?: string;
}

// The mark reads as an "M" built from three converging neural pathways meeting at
// weighted nodes — echoing signal convergence in a network rather than a static letterform.
export default function Logo({ size = 36, withWordmark = true, className = '' }: LogoProps) {
  return (
    <div className={`flex items-center gap-3 ${className}`}>
      <svg width={size} height={size} viewBox="0 0 64 64" fill="none" aria-hidden="true">
        <defs>
          <linearGradient id="mev-logo-grad" x1="8" y1="48" x2="56" y2="16" gradientUnits="userSpaceOnUse">
            <stop offset="0" stopColor="#FFFFFF" />
            <stop offset="0.5" stopColor="#E5E5E5" />
            <stop offset="1" stopColor="#A3A3A3" />
          </linearGradient>
        </defs>
        <rect width="64" height="64" rx="16" fill="#0B0B0B" />
        <path
          d="M12 46V18L24 34L32 22L40 34L52 18V46"
          stroke="url(#mev-logo-grad)"
          strokeWidth="5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <circle cx="12" cy="18" r="3" fill="#E5E5E5" />
        <circle cx="52" cy="18" r="3" fill="#E5E5E5" />
        <circle cx="32" cy="22" r="2.5" fill="#FFFFFF" />
      </svg>
      {withWordmark && (
        <span className="font-display font-bold text-lg tracking-tight text-paper">
          MEV <span className="gold-text">AI</span>
        </span>
      )}
    </div>
  );
}
