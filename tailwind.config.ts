import type { Config } from 'tailwindcss';

export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        obsidian: {
          DEFAULT: 'rgb(var(--c-bg) / <alpha-value>)',
          soft: 'rgb(var(--c-bg-soft) / <alpha-value>)',
          raised: 'rgb(var(--c-bg-raised) / <alpha-value>)',
          border: 'rgb(var(--c-border) / <alpha-value>)'
        },
        gold: {
          DEFAULT: 'rgb(var(--c-accent) / <alpha-value>)',
          bright: 'rgb(var(--c-accent-bright) / <alpha-value>)',
          deep: 'rgb(var(--c-accent-deep) / <alpha-value>)',
          amber: 'rgb(var(--c-accent) / <alpha-value>)'
        },
        paper: 'rgb(var(--c-ink) / <alpha-value>)',
        ink: 'rgb(var(--c-ink) / <alpha-value>)',
        'on-accent': 'rgb(var(--c-on-accent) / <alpha-value>)'
      },
      fontFamily: {
        display: ['"Sora"', 'sans-serif'],
        body: ['"Inter"', 'sans-serif']
      },
      backgroundImage: {
        'gold-gradient': 'linear-gradient(135deg, rgb(var(--c-accent-bright)) 0%, rgb(var(--c-accent)) 50%, rgb(var(--c-accent-deep)) 100%)',
        'mesh-glow': 'radial-gradient(60% 60% at 50% 0%, rgb(var(--c-accent) / 0.10) 0%, rgb(var(--c-bg) / 0) 70%)'
      },
      boxShadow: {
        premium: '0 8px 32px rgba(0,0,0,0.45), inset 0 1px 0 rgba(255,255,255,0.04)',
        'gold-glow': '0 0 40px rgb(var(--c-accent) / 0.25)'
      },
      borderRadius: {
        xl2: '1.25rem'
      },
      keyframes: {
        float: { '0%,100%': { transform: 'translateY(0px)' }, '50%': { transform: 'translateY(-12px)' } },
        pulseGlow: { '0%,100%': { opacity: '0.5' }, '50%': { opacity: '1' } },
        shimmer: { '0%': { backgroundPosition: '-200% 0' }, '100%': { backgroundPosition: '200% 0' } }
      },
      animation: {
        float: 'float 6s ease-in-out infinite',
        pulseGlow: 'pulseGlow 3s ease-in-out infinite',
        shimmer: 'shimmer 3s linear infinite'
      }
    }
  },
  plugins: []
} satisfies Config;
