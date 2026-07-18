import { motion } from 'framer-motion';
import { Star } from 'lucide-react';
import GlassCard from '../common/GlassCard';

const testimonials = [
  {
    quote: 'Switched our whole content team from three separate tools to MEV AI. The PDF chat alone saved us hours every week.',
    name: 'Ananya Rao',
    role: 'Content Lead, Studio Nine',
  },
  {
    quote: 'The code assistant actually understands the context of my repo instead of guessing. Genuinely useful, not a gimmick.',
    name: 'Rohan Mehta',
    role: 'Full-stack Developer',
  },
  {
    quote: 'Voice chat in my own language changed how I use AI day to day. It feels built for how I actually think.',
    name: 'Sneha Iyer',
    role: 'Product Designer',
  },
];

export default function Testimonials() {
  return (
    <section id="testimonials" className="section-pad">
      <div className="text-center max-w-2xl mx-auto mb-16">
        <p className="text-gold text-sm font-medium tracking-wide uppercase mb-3">Testimonials</p>
        <h2 className="font-display font-bold text-3xl md:text-4xl text-paper mb-4">Trusted by people who ship</h2>
      </div>

      <div className="grid md:grid-cols-3 gap-6">
        {testimonials.map((t, i) => (
          <motion.div
            key={t.name}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-60px' }}
            transition={{ duration: 0.5, delay: i * 0.08 }}
          >
            <GlassCard className="p-6 h-full">
              <div className="flex gap-1 mb-4">
                {Array.from({ length: 5 }).map((_, idx) => (
                  <Star key={idx} size={14} className="fill-gold text-gold" />
                ))}
              </div>
              <p className="text-ink/70 text-sm leading-relaxed mb-6">"{t.quote}"</p>
              <div>
                <p className="text-paper font-medium text-sm">{t.name}</p>
                <p className="text-ink/40 text-xs">{t.role}</p>
              </div>
            </GlassCard>
          </motion.div>
        ))}
      </div>
    </section>
  );
}
