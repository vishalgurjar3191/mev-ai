import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Menu, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import Logo from '../common/Logo';
import { useAuth } from '../../context/AuthContext';

const links = [
  { label: 'Features', href: '#features' },
  { label: 'Pricing', href: '#pricing' },
  { label: 'Testimonials', href: '#testimonials' },
  { label: 'FAQ', href: '#faq' },
];

export default function Navbar() {
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const { firebaseUser } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <header
      className={`fixed top-0 inset-x-0 z-50 transition-all duration-300 ${
        scrolled ? 'glass border-b border-ink/[0.08]' : 'bg-transparent'
      }`}
    >
      <nav className="flex items-center justify-between px-6 md:px-12 lg:px-24 py-4">
        <Link to="/">
          <Logo />
        </Link>

        <div className="hidden md:flex items-center gap-8">
          {links.map((link) => (
            <a key={link.href} href={link.href} className="text-sm text-ink/70 hover:text-gold transition-colors">
              {link.label}
            </a>
          ))}
        </div>

        <div className="hidden md:flex items-center gap-3">
          {firebaseUser ? (
            <button onClick={() => navigate('/dashboard')} className="btn-gold text-sm py-2.5">
              Go to Dashboard
            </button>
          ) : (
            <>
              <button onClick={() => navigate('/login')} className="btn-ghost text-sm py-2.5">
                Log In
              </button>
              <button onClick={() => navigate('/register')} className="btn-gold text-sm py-2.5">
                Get Started
              </button>
            </>
          )}
        </div>

        <button className="md:hidden text-paper" onClick={() => setOpen(!open)} aria-label="Toggle menu">
          {open ? <X size={24} /> : <Menu size={24} />}
        </button>
      </nav>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="md:hidden glass border-t border-ink/[0.08] overflow-hidden"
          >
            <div className="flex flex-col gap-4 px-6 py-6">
              {links.map((link) => (
                <a key={link.href} href={link.href} onClick={() => setOpen(false)} className="text-ink/80 text-sm">
                  {link.label}
                </a>
              ))}
              <div className="flex flex-col gap-3 pt-2">
                {firebaseUser ? (
                  <button onClick={() => navigate('/dashboard')} className="btn-gold text-sm py-2.5">
                    Go to Dashboard
                  </button>
                ) : (
                  <>
                    <button onClick={() => navigate('/login')} className="btn-ghost text-sm py-2.5">
                      Log In
                    </button>
                    <button onClick={() => navigate('/register')} className="btn-gold text-sm py-2.5">
                      Get Started
                    </button>
                  </>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
