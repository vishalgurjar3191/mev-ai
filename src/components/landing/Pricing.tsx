import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Check } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import GlassCard from '../common/GlassCard';
import { listPlans } from '../../lib/plans';
import { Plan } from '../../types';

// Shown only if the admin hasn't set up any plans yet in Admin -> Plans, so the landing page
// never looks broken to a brand-new visitor.
const FALLBACK_PLANS: Plan[] = [
  { id: 'free', name: 'Free', tier: 'free', priceINR: 0, chatLimitPerDay: 20, features: ['20 chats/day', 'Standard response speed'], active: true, sortOrder: 0 },
];

export default function Pricing() {
  const navigate = useNavigate();
  const [plans, setPlans] = useState<Plan[]>(FALLBACK_PLANS);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    listPlans()
      .then((all) => {
        const active = all.filter((p) => p.active);
        if (active.length) setPlans(active);
      })
      .finally(() => setLoaded(true));
  }, []);

  const sorted = [...plans].sort((a, b) => a.sortOrder - b.sortOrder);
  const highlightId = sorted[1]?.id; // second-cheapest = "Most Popular"

  return (
    <section id="pricing" className="section-pad">
      <div className="text-center max-w-2xl mx-auto mb-16">
        <p className="text-gold text-sm font-medium tracking-wide uppercase mb-3">Pricing</p>
        <h2 className="font-display font-bold text-3xl md:text-4xl text-paper mb-4">Plans that scale with you</h2>
        <p className="text-ink/50">Start free. Upgrade the moment you need more.</p>
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {loaded &&
          sorted.map((plan, i) => {
            const highlight = plan.id === highlightId;
            return (
              <motion.div
                key={plan.id}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: '-60px' }}
                transition={{ duration: 0.5, delay: i * 0.08 }}
              >
                <GlassCard
                  strong={highlight}
                  className={`p-6 h-full flex flex-col ${highlight ? 'border-gold/40 shadow-gold-glow relative' : ''}`}
                >
                  {highlight && (
                    <span className="absolute -top-3 left-1/2 -translate-x-1/2 bg-gold-gradient text-on-accent text-xs font-semibold px-3 py-1 rounded-full">
                      Most Popular
                    </span>
                  )}
                  <h3 className="font-display font-semibold text-lg text-paper mb-1">{plan.name}</h3>
                  <div className="flex items-baseline gap-1 mb-6">
                    <span className="text-3xl font-display font-bold text-paper">
                      {plan.priceINR > 0 ? `₹${plan.priceINR}` : '₹0'}
                    </span>
                    <span className="text-ink/40 text-sm">{plan.priceINR > 0 ? '/ month' : 'forever'}</span>
                  </div>
                  <ul className="space-y-3 mb-8 flex-1">
                    {plan.features.map((f) => (
                      <li key={f} className="flex items-start gap-2 text-sm text-ink/70">
                        <Check size={16} className="text-gold mt-0.5 shrink-0" />
                        <span>{f}</span>
                      </li>
                    ))}
                  </ul>
                  <button onClick={() => navigate('/register')} className={highlight ? 'btn-gold w-full' : 'btn-ghost w-full'}>
                    {plan.priceINR === 0 ? 'Start Free' : 'Choose ' + plan.name}
                  </button>
                </GlassCard>
              </motion.div>
            );
          })}
      </div>
    </section>
  );
}
