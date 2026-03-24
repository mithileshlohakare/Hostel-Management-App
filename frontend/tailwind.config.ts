import type { Config } from 'tailwindcss';

const config: Config = {
  darkMode: ['class'],
  content: ['./app/**/*.{ts,tsx}', './components/**/*.{ts,tsx}', './lib/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        background: '#070b14',
        foreground: '#e5e7eb',
        card: '#0d1424',
        muted: '#94a3b8',
        primary: '#60a5fa',
        accent: '#22d3ee',
        border: '#1f2a44',
      },
      borderRadius: {
        lg: '0.75rem',
        xl: '1rem',
      },
      boxShadow: {
        panel: '0 8px 32px rgba(4, 8, 19, 0.45)',
      },
    },
  },
  plugins: [],
};

export default config;
