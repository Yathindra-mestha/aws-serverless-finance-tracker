/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        // Plus Jakarta Sans — geometric, humanist, perfect for fintech dashboards
        sans: ['"Plus Jakarta Sans"', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'sans-serif'],
        // DM Mono — clean, crisp mono for currency amounts, codes, logs
        mono: ['"DM Mono"', 'ui-monospace', 'Menlo', 'Monaco', 'monospace'],
      },
      fontSize: {
        // Tighter line-heights for dashboard density
        '2xs': ['0.625rem', { lineHeight: '1rem' }],
        'xs':  ['0.75rem',  { lineHeight: '1.125rem' }],
        'sm':  ['0.8125rem',{ lineHeight: '1.25rem'  }],
        'base':['0.9375rem',{ lineHeight: '1.5rem'   }],
      },
      letterSpacing: {
        'tightest': '-0.03em',
        'tighter':  '-0.02em',
        'tight':    '-0.01em',
        'wide-sm':   '0.04em',
        'wide':      '0.06em',
        'widest':    '0.1em',
      },
      colors: {
        surface: {
          950: '#05080f',
          900: '#0a101f',
          800: '#0f172a',
          700: '#1a2438',
          600: '#263045',
          500: '#334155',
        },
        brand: {
          300: '#a5b4fc',
          400: '#818cf8',
          500: '#6366f1',
          600: '#4f46e5',
          700: '#4338ca',
        },
        aws: {
          orange: '#FF9900',
          amber:  '#FFB347',
          dark:   '#232F3E',
          squid:  '#1A242F',
        },
      },
      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
      },
      boxShadow: {
        'card':       '0 2px 16px -2px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.05)',
        'card-hover': '0 8px 32px -4px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.07)',
        'card-lg':    '0 16px 48px -8px rgba(0,0,0,0.6)',
        'indigo':     '0 0 28px -6px rgba(99,102,241,0.55)',
        'emerald':    '0 0 28px -6px rgba(16,185,129,0.55)',
        'rose':       '0 0 28px -6px rgba(244,63,94,0.55)',
        'amber':      '0 0 28px -6px rgba(245,158,11,0.55)',
        'aws-orange': '0 0 28px -6px rgba(255,153,0,0.45)',
      },
      animation: {
        'fade-up':   'fadeUp 0.4s cubic-bezier(.16,1,.3,1) forwards',
        'scale-in':  'scaleIn 0.25s cubic-bezier(.16,1,.3,1) forwards',
        'shimmer':   'shimmer 1.8s linear infinite',
        'ping-slow': 'ping 1.8s cubic-bezier(0,0,0.2,1) infinite',
        'float':     'float 3s ease-in-out infinite',
      },
      keyframes: {
        fadeUp:  { from: { opacity:'0', transform:'translateY(14px)' }, to: { opacity:'1', transform:'translateY(0)' } },
        scaleIn: { from: { opacity:'0', transform:'scale(0.93)' }, to: { opacity:'1', transform:'scale(1)' } },
        shimmer: { from: { 'background-position': '-200% 0' }, to: { 'background-position': '200% 0' } },
        float:   { '0%,100%': { transform: 'translateY(0px)' }, '50%': { transform: 'translateY(-4px)' } },
      },
    },
  },
  plugins: [],
};
