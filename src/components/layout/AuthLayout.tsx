import { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import Logo from '../common/Logo';
import GlassCard from '../common/GlassCard';
import NeuralField from '../common/NeuralField';

interface AuthLayoutProps {
  title: string;
  subtitle: string;
  children: ReactNode;
}

export default function AuthLayout({ title, subtitle, children }: AuthLayoutProps) {
  return (
    <div className="relative min-h-screen flex items-center justify-center px-4 py-16 overflow-hidden">
      <NeuralField className="absolute inset-0 w-full h-full opacity-50" />
      <div className="absolute inset-0 bg-mesh-glow pointer-events-none" />

      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="relative z-10 w-full max-w-md"
      >
        <div className="flex justify-center mb-8">
          <Link to="/">
            <Logo size={44} />
          </Link>
        </div>

        <GlassCard strong className="p-8">
          <h1 className="font-display font-bold text-2xl text-paper text-center mb-2">{title}</h1>
          <p className="text-ink/50 text-sm text-center mb-8">{subtitle}</p>
          {children}
        </GlassCard>
      </motion.div>
    </div>
  );
}
