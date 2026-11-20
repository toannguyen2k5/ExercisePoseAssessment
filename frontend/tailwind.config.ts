/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      colors: {
        glass: {
          white: 'rgba(255,255,255,0.75)',
          border: 'rgba(255,255,255,0.6)',
          shadow: 'rgba(99,102,241,0.08)',
        },
      },
      backdropBlur: {
        xs: '4px',
        glass: '16px',
        heavy: '24px',
      },
      boxShadow: {
        glass: '0 4px 24px rgba(99,102,241,0.08), 0 1px 2px rgba(0,0,0,0.04)',
        'glass-hover': '0 8px 40px rgba(99,102,241,0.15), 0 2px 8px rgba(0,0,0,0.06)',
        'glass-lg': '0 16px 48px rgba(99,102,241,0.12), 0 4px 16px rgba(0,0,0,0.06)',
        glow: '0 0 24px rgba(99,102,241,0.35)',
        'glow-green': '0 0 24px rgba(16,185,129,0.35)',
        'glow-rose': '0 0 24px rgba(244,63,94,0.35)',
      },
      backgroundImage: {
        'page-gradient': 'linear-gradient(135deg, #eef2ff 0%, #faf5ff 40%, #ecfdf5 100%)',
        'card-gradient': 'linear-gradient(135deg, rgba(255,255,255,0.9) 0%, rgba(255,255,255,0.7) 100%)',
        'accent-gradient': 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
        'green-gradient': 'linear-gradient(135deg, #10b981 0%, #06b6d4 100%)',
        'score-gradient': 'conic-gradient(from 180deg, #6366f1, #8b5cf6, #06b6d4)',
      },
      animation: {
        'blob-1': 'blob 12s ease-in-out infinite',
        'blob-2': 'blob 15s ease-in-out infinite 3s',
        'blob-3': 'blob 10s ease-in-out infinite 6s',
        'fade-in': 'fadeIn 0.5s ease-out',
        'slide-up': 'slideUp 0.4s ease-out',
        'pulse-glow': 'pulseGlow 2s ease-in-out infinite',
        shimmer: 'shimmer 1.5s infinite',
      },
      keyframes: {
        blob: {
          '0%, 100%': { transform: 'translate(0, 0) scale(1)' },
          '33%': { transform: 'translate(40px, -30px) scale(1.1)' },
          '66%': { transform: 'translate(-20px, 20px) scale(0.95)' },
        },
        fadeIn: {
          from: { opacity: '0' },
          to: { opacity: '1' },
        },
        slideUp: {
          from: { opacity: '0', transform: 'translateY(16px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
        pulseGlow: {
          '0%, 100%': { boxShadow: '0 0 16px rgba(99,102,241,0.3)' },
          '50%': { boxShadow: '0 0 32px rgba(99,102,241,0.6)' },
        },
        shimmer: {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
      },
      borderRadius: {
        '2.5xl': '1.25rem',
        '3xl': '1.5rem',
      },
    },
  },
  plugins: [],
};

