import { motion } from 'framer-motion';
import { ArrowRight, Sparkles } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import NeuralField from '../common/NeuralField';
import GlassCard from '../common/GlassCard';

export default function Hero() {
  const navigate = useNavigate();

  return (
    <section className="relative min-h-screen flex items-center overflow-hidden pt-24">
      <NeuralField className="absolute inset-0 w-full h-full opacity-70" />
      <div className="absolute inset-0 bg-mesh-glow pointer-events-none" />

      <div className="relative z-10 w-full section-pad grid lg:grid-cols-2 gap-12 items-center">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, ease: 'easeOut' }}
        >
          <div className="inline-flex items-center gap-2 glass rounded-full px-4 py-1.5 mb-6 text-xs text-gold">
            <Sparkles size={14} />
            <span>One platform. Every kind of intelligence.</span>
          </div>

          <h1 className="font-display font-extrabold text-4xl sm:text-5xl lg:text-6xl leading-[1.08] tracking-tight text-paper mb-6">
            Intelligence <span className="gold-text">Without Limits</span>
          </h1>

          <p className="text-ink/60 text-lg leading-relaxed max-w-xl mb-10">
            MEV AI brings chat, image generation, voice, document understanding, code assistance
            and live web search into a single, premium workspace — built to move at the speed of thought.
          </p>

          <div className="flex flex-wrap items-center gap-4">
            <button onClick={() => navigate('/register')} className="btn-gold flex items-center gap-2">
              Start Free <ArrowRight size={18} />
            </button>
            <a href="#features" className="btn-ghost">
              Explore Features
            </a>
          </div>

          <div className="flex items-center gap-8 mt-12 text-ink/40 text-sm">
            <div>
              <p className="text-2xl font-display font-bold text-paper">20+</p>
              <p>AI capabilities</p>
            </div>
            <div className="w-px h-10 bg-ink/10" />
            <div>
              <p className="text-2xl font-display font-bold text-paper">99.9%</p>
              <p>Uptime</p>
            </div>
            <div className="w-px h-10 bg-ink/10" />
            <div>
              <p className="text-2xl font-display font-bold text-paper">4 plans</p>
              <p>Free to Business</p>
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, scale: 0.94 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.8, ease: 'easeOut', delay: 0.15 }}
          className="relative hidden lg:block"
        >
          <GlassCard strong className="p-6 animate-float">
            <div className="flex items-center gap-2 mb-4">
              <span className="w-2.5 h-2.5 rounded-full bg-ink/20" />
              <span className="w-2.5 h-2.5 rounded-full bg-ink/20" />
              <span className="w-2.5 h-2.5 rounded-full bg-gold/60" />
            </div>
            <div className="space-y-3">
              <div className="glass rounded-xl px-4 py-3 text-sm text-ink/70 max-w-[80%]">
                Summarize this quarterly report and flag any revenue risks.
              </div>
              <div className="glass rounded-xl px-4 py-3 text-sm text-ink/90 max-w-[85%] ml-auto border-gold/20">
                Revenue grew 18% QoQ. Two risks stand out: customer concentration
                in APAC and a slowing renewal rate in the SMB tier...
              </div>
              <div className="flex gap-2">
                <span className="glass rounded-full px-3 py-1 text-xs text-gold">PDF Chat</span>
                <span className="glass rounded-full px-3 py-1 text-xs text-ink/50">Code Assistant</span>
                <span className="glass rounded-full px-3 py-1 text-xs text-ink/50">Voice</span>
              </div>
            </div>
          </GlassCard>
          <div className="absolute -bottom-6 -left-6 w-24 h-24 bg-gold/10 blur-3xl rounded-full animate-pulseGlow" />
        </motion.div>
      </div>
    </section>
  );
}
