import { motion } from 'framer-motion';
import { Check } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import GlassCard from '../common/GlassCard';

const plans = [
  {
    name: 'Free',
    price: '₹0',
    period: 'forever',
    features: ['20 chats / day', 'Standard response speed', 'Community support'],
    highlight: false,
  },
  {
    name: 'Pro',
    price: '₹499',
    period: '/ month',
    features: ['Unlimited chats', 'Voice chat included', 'Image AI included', 'Priority queue'],
    highlight: true,
  },
  {
    name: 'Premium',
    price: '₹999',
    period: '/ month',
    features: ['Everything in Pro', 'Fastest response speed', 'Higher usage limits', 'Early access to new AI tools'],
    highlight: false,
  },
  {
    name: 'Business',
    price: '₹2,999',
    period: '/ month',
    features: ['Everything in Premium', 'Team management', 'API access', 'Dedicated support'],
    highlight: false,
  },
];

export default function Pricing() {
  const navigate = useNavigate();

  return (
    <section id="pricing" className="section-pad">
      <div className="text-center max-w-2xl mx-auto mb-16">
        <p className="text-gold text-sm font-medium tracking-wide uppercase mb-3">Pricing</p>
        <h2 className="font-display font-bold text-3xl md:text-4xl text-paper mb-4">
          Plans that scale with you
        </h2>
        <p className="text-ink/50">Start free. Upgrade the moment you need more.</p>
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {plans.map((plan, i) => (
          <motion.div
            key={plan.name}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-60px' }}
            transition={{ duration: 0.5, delay: i * 0.08 }}
          >
            <GlassCard
              strong={plan.highlight}
              className={`p-6 h-full flex flex-col ${plan.highlight ? 'border-gold/40 shadow-gold-glow relative' : ''}`}
            >
              {plan.highlight && (
                <span className="absolute -top-3 left-1/2 -translate-x-1/2 bg-gold-gradient text-on-accent text-xs font-semibold px-3 py-1 rounded-full">
                  Most Popular
                </span>
              )}
              <h3 className="font-display font-semibold text-lg text-paper mb-1">{plan.name}</h3>
              <div className="flex items-baseline gap-1 mb-6">
                <span className="text-3xl font-display font-bold text-paper">{plan.price}</span>
                <span className="text-ink/40 text-sm">{plan.period}</span>
              </div>
              <ul className="space-y-3 mb-8 flex-1">
                {plan.features.map((f) => (
                  <li key={f} className="flex items-start gap-2 text-sm text-ink/70">
                    <Check size={16} className="text-gold mt-0.5 shrink-0" />
                    <span>{f}</span>
                  </li>
                ))}
              </ul>
              <button
                onClick={() => navigate('/register')}
                className={plan.highlight ? 'btn-gold w-full' : 'btn-ghost w-full'}
              >
                {plan.name === 'Free' ? 'Start Free' : 'Choose ' + plan.name}
              </button>
            </GlassCard>
          </motion.div>
        ))}
      </div>
    </section>
  );
}
