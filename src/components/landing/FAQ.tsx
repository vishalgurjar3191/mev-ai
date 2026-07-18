import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown } from 'lucide-react';
import GlassCard from '../common/GlassCard';

const faqs = [
  { q: 'Is there a free plan?', a: 'Yes — the Free plan includes 20 chats per day at no cost, no credit card required.' },
  { q: 'Can I cancel my subscription anytime?', a: 'Yes. You can cancel from your account settings and you\u2019ll keep access until the end of your billing period.' },
  { q: 'What payment methods are supported?', a: 'We support UPI, credit and debit cards, net banking, and popular wallets through Razorpay.' },
  { q: 'Is my data secure?', a: 'Your data is protected with Firebase security rules, encrypted connections, and strict role-based access controls.' },
  { q: 'Do you offer team or business accounts?', a: 'Yes — the Business plan includes team management and API access for organizations.' },
];

export default function FAQ() {
  const [open, setOpen] = useState<number | null>(0);

  return (
    <section id="faq" className="section-pad max-w-3xl mx-auto">
      <div className="text-center mb-14">
        <p className="text-gold text-sm font-medium tracking-wide uppercase mb-3">FAQ</p>
        <h2 className="font-display font-bold text-3xl md:text-4xl text-paper">Questions, answered</h2>
      </div>

      <div className="space-y-4">
        {faqs.map((item, i) => (
          <GlassCard key={item.q} className="overflow-hidden">
            <button
              className="w-full flex items-center justify-between p-5 text-left"
              onClick={() => setOpen(open === i ? null : i)}
              aria-expanded={open === i}
            >
              <span className="font-medium text-paper text-sm md:text-base">{item.q}</span>
              <ChevronDown
                size={18}
                className={`text-gold shrink-0 transition-transform duration-300 ${open === i ? 'rotate-180' : ''}`}
              />
            </button>
            <AnimatePresence>
              {open === i && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.25 }}
                  className="overflow-hidden"
                >
                  <p className="px-5 pb-5 text-ink/50 text-sm leading-relaxed">{item.a}</p>
                </motion.div>
              )}
            </AnimatePresence>
          </GlassCard>
        ))}
      </div>
    </section>
  );
}
