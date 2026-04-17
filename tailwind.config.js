/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        // Zoho-inspired: Deep Navy + White + Purple
        navy: {
          950: '#04080F',
          900: '#070D1C',
          800: '#0C1630',
          700: '#102048',
          600: '#152858',
          500: '#1A3170',
        },
        primary: {
          50:  '#EDE9FE',
          100: '#DDD6FE',
          200: '#C4B5FD',
          300: '#A78BFA',
          400: '#8B5CF6',
          500: '#7C3AED',
          600: '#6D28D9',
          700: '#5B21B6',
          800: '#4C1D95',
          900: '#3B0764',
        },
        zoho: {
          purple:  '#7C3AED',
          violet:  '#8B5CF6',
          lavender:'#A78BFA',
          indigo:  '#4F46E5',
          blue:    '#3B82F6',
          teal:    '#0D9488',
          cyan:    '#0891B2',
          white:   '#FAFBFF',
        },
        surface: {
          50:  '#F8F9FF',
          100: '#F0F2FF',
          card:'#0F1A2E',
          dark:'#0C1526',
        }
      },
      fontFamily: {
        sans:    ['Plus Jakarta Sans', 'Inter', 'sans-serif'],
        display: ['Outfit', 'Plus Jakarta Sans', 'sans-serif'],
        mono:    ['JetBrains Mono', 'monospace'],
      },
      animation: {
        'fade-in':    'fadeIn 0.4s ease both',
        'slide-up':   'slideUp 0.45s ease both',
        'scale-in':   'scaleIn 0.35s ease both',
        'pulse-dot':  'pulseDot 1.6s ease-in-out infinite',
        'float':      'float 4s ease-in-out infinite',
        'gradient':   'gradientShift 5s ease infinite',
        'ping-slow':  'ping 1.6s ease-in-out infinite',
        'glow':       'glowPulse 3s ease-in-out infinite',
        'notif-pop':  'notifPop 0.4s ease both',
      },
      keyframes: {
        fadeIn:       { from: { opacity: '0' },                             to: { opacity: '1' } },
        slideUp:      { from: { opacity: '0', transform: 'translateY(20px)' }, to: { opacity: '1', transform: 'translateY(0)' } },
        scaleIn:      { from: { opacity: '0', transform: 'scale(0.92)' },   to: { opacity: '1', transform: 'scale(1)' } },
        float:        { '0%,100%': { transform: 'translateY(0)' },          '50%': { transform: 'translateY(-8px)' } },
        gradientShift:{ '0%,100%': { backgroundPosition: '0% 50%' },        '50%': { backgroundPosition: '100% 50%' } },
        glowPulse:    { '0%,100%': { boxShadow: '0 0 20px rgba(124,58,237,0.4)' }, '50%': { boxShadow: '0 0 40px rgba(124,58,237,0.7)' } },
        notifPop:     { '0%': { transform: 'scale(0)', opacity: '0' }, '70%': { transform: 'scale(1.15)', opacity: '1' }, '100%': { transform: 'scale(1)', opacity: '1' } },
        pulseDot:     { '0%,100%': { opacity: '1' }, '50%': { opacity: '0.4' } },
      },
      backgroundSize: { '200': '200% 200%' },
      boxShadow: {
        'purple-glow': '0 0 0 1px rgba(124,58,237,0.2), 0 8px 32px rgba(124,58,237,0.2)',
        'card':        '0 4px 20px rgba(0,0,0,0.4)',
        'card-hover':  '0 8px 32px rgba(0,0,0,0.5)',
        'btn':         '0 4px 14px rgba(124,58,237,0.5)',
        'btn-hover':   '0 6px 22px rgba(124,58,237,0.7)',
        'topbar':      '0 1px 0 rgba(124,58,237,0.3)',
        'input-focus': '0 0 0 3px rgba(124,58,237,0.15)',
      },
    },
  },
  plugins: [],
}
