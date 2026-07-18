import { motion } from 'framer-motion';
import { MessageSquare, ImageIcon, Mic, FileText, Code2, Search } from 'lucide-react';
import GlassCard from '../common/GlassCard';

const features = [
  { icon: MessageSquare, title: 'AI Chat', desc: 'Fluid, markdown-aware conversations with code highlighting, editing and regeneration.' },
  { icon: ImageIcon, title: 'Image Generator', desc: 'Turn a prompt into a finished image, then refine, download or revisit it anytime.' },
  { icon: Mic, title: 'Voice Chat', desc: 'Speak naturally and hear responses back, in the language you choose.' },
  { icon: FileText, title: 'PDF Chat', desc: 'Upload a document, ask questions, get summaries and pull out exactly what matters.' },
  { icon: Code2, title: 'Code Assistant', desc: 'Debug, refactor and write code with an assistant that understands context.' },
  { icon: Search, title: 'Web Search', desc: 'Live answers grounded in real sources, with links back to where they came from.' },
];

export default function Features() {
  return (
    <section id="features" className="section-pad relative">
      <div className="text-center max-w-2xl mx-auto mb-16">
        <p className="text-gold text-sm font-medium tracking-wide uppercase mb-3">Capabilities</p>
        <h2 className="font-display font-bold text-3xl md:text-4xl text-paper mb-4">
          Every way you think, in one workspace
        </h2>
        <p className="text-ink/50">
          No more switching tabs between five different tools. MEV AI adapts to how you work.
        </p>
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {features.map((f, i) => (
          <motion.div
            key={f.title}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-60px' }}
            transition={{ duration: 0.5, delay: i * 0.06 }}
          >
            <GlassCard className="p-6 h-full hover:border-gold/30 transition-colors duration-300 group">
              <div className="w-12 h-12 rounded-xl glass flex items-center justify-center mb-5 group-hover:bg-gold/10 transition-colors">
                <f.icon size={22} className="text-gold" />
              </div>
              <h3 className="font-display font-semibold text-lg text-paper mb-2">{f.title}</h3>
              <p className="text-ink/50 text-sm leading-relaxed">{f.desc}</p>
            </GlassCard>
          </motion.div>
        ))}
      </div>
    </section>
  );
}
