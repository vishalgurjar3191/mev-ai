import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import Logo from '../components/common/Logo';
import NeuralField from '../components/common/NeuralField';

export default function NotFound() {
  return (
    <div className="relative min-h-screen flex items-center justify-center px-6 overflow-hidden">
      <NeuralField className="absolute inset-0 w-full h-full opacity-40" />
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="relative z-10 text-center"
      >
        <div className="flex justify-center mb-8">
          <Logo size={44} />
        </div>
        <p className="font-display font-extrabold text-7xl gold-text mb-4">404</p>
        <h1 className="font-display font-semibold text-2xl text-paper mb-3">This page drifted off the grid</h1>
        <p className="text-ink/50 text-sm mb-8 max-w-sm mx-auto">
          The page you're looking for doesn't exist or may have moved.
        </p>
        <Link to="/" className="btn-gold">Back to Home</Link>
      </motion.div>
    </div>
  );
}
