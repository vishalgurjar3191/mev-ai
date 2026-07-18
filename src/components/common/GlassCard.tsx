import { ReactNode, HTMLAttributes } from 'react';

interface GlassCardProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
  strong?: boolean;
}

export default function GlassCard({ children, strong = false, className = '', ...rest }: GlassCardProps) {
  return (
    <div className={`${strong ? 'glass-strong' : 'glass'} rounded-xl2 ${className}`} {...rest}>
      {children}
    </div>
  );
}
