import { Link } from 'react-router-dom';
import { Twitter, Linkedin, Github } from 'lucide-react';
import Logo from '../common/Logo';

export default function Footer() {
  return (
    <footer className="border-t border-ink/[0.06] section-pad !py-14">
      <div className="grid md:grid-cols-4 gap-10">
        <div>
          <Logo />
          <p className="text-ink/40 text-sm mt-4 max-w-xs">
            Intelligence without limits — one premium AI workspace for chat, image, voice, PDF and code.
          </p>
          <div className="flex gap-3 mt-5">
            <a href="#" aria-label="Twitter" className="w-9 h-9 glass rounded-full flex items-center justify-center hover:text-gold">
              <Twitter size={16} />
            </a>
            <a href="#" aria-label="LinkedIn" className="w-9 h-9 glass rounded-full flex items-center justify-center hover:text-gold">
              <Linkedin size={16} />
            </a>
            <a href="#" aria-label="GitHub" className="w-9 h-9 glass rounded-full flex items-center justify-center hover:text-gold">
              <Github size={16} />
            </a>
          </div>
        </div>

        <div>
          <h4 className="text-paper font-medium text-sm mb-4">Product</h4>
          <ul className="space-y-2 text-sm text-ink/40">
            <li><a href="#features" className="hover:text-gold">Features</a></li>
            <li><a href="#pricing" className="hover:text-gold">Pricing</a></li>
            <li><a href="#faq" className="hover:text-gold">FAQ</a></li>
          </ul>
        </div>

        <div>
          <h4 className="text-paper font-medium text-sm mb-4">Company</h4>
          <ul className="space-y-2 text-sm text-ink/40">
            <li><a href="#" className="hover:text-gold">About</a></li>
            <li><a href="#" className="hover:text-gold">Blog</a></li>
            <li><a href="#" className="hover:text-gold">Careers</a></li>
          </ul>
        </div>

        <div>
          <h4 className="text-paper font-medium text-sm mb-4">Legal</h4>
          <ul className="space-y-2 text-sm text-ink/40">
            <li><a href="#" className="hover:text-gold">Privacy Policy</a></li>
            <li><a href="#" className="hover:text-gold">Terms of Service</a></li>
            <li><a href="#" className="hover:text-gold">Refund Policy</a></li>
          </ul>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row justify-between items-center gap-3 mt-12 pt-8 border-t border-ink/[0.06] text-ink/30 text-xs">
        <p>© {new Date().getFullYear()} MEV AI. All rights reserved.</p>
        <Link to="/admin/login" className="hover:text-gold/60">Admin</Link>
      </div>
    </footer>
  );
}
