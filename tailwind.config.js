/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        primary: '#6366F1',
        secondary: '#8B5CF6',
        accent: '#F59E0B',
        surface: '#F8FAFC',
        'surface-dark': '#0F172A',
        'text-primary': '#1E293B',
        'text-secondary': '#64748B',
        'glass': 'rgba(255, 255, 255, 0.1)',
        'indigo': {
          50: '#EEF2FF',
          500: '#6366F1',
          600: '#4F46E5',
          700: '#4338CA',
        },
        'violet': {
          50: '#F5F3FF',
          500: '#8B5CF6',
          600: '#7C3AED',
          700: '#6D28D9',
        },
      },
      animation: {
        'fade-in': 'fadeIn 0.6s cubic-bezier(0.4, 0, 0.2, 1)',
        'slide-up': 'slideUp 0.6s cubic-bezier(0.4, 0, 0.2, 1)',
        'float': 'float 6s ease-in-out infinite',
        'bounce-gentle': 'bounceGentle 0.3s cubic-bezier(0.68, -0.55, 0.265, 1.55)',
        'scale-bounce': 'scaleBounce 0.2s cubic-bezier(0.68, -0.55, 0.265, 1.55)',
      },
             keyframes: {
         fadeIn: {
           '0%': { opacity: '0', transform: 'translateY(10px)' },
           '100%': { opacity: '1', transform: 'translateY(0)' },
         },
         slideUp: {
           '0%': { transform: 'translateY(30px)', opacity: '0' },
           '100%': { transform: 'translateY(0)', opacity: '1' },
         },
         float: {
           '0%, 100%': { transform: 'translateY(0px)' },
           '50%': { transform: 'translateY(-10px)' },
         },
         bounceGentle: {
           '0%, 100%': { transform: 'scale(1)' },
           '50%': { transform: 'scale(1.05)' },
         },
         scaleBounce: {
           '0%': { transform: 'scale(1)' },
           '50%': { transform: 'scale(1.1)' },
           '100%': { transform: 'scale(1)' },
         },
         qrBounceIn: {
           '0%': { 
             transform: 'translateX(-50%) scale(0.3)',
             opacity: '0'
           },
           '50%': { 
             transform: 'translateX(-50%) scale(1.05)',
             opacity: '0.8'
           },
           '70%': { 
             transform: 'translateX(-50%) scale(0.95)',
             opacity: '0.9'
           },
           '100%': { 
             transform: 'translateX(-50%) scale(1)',
             opacity: '1'
           },
         },
         instantBounce: {
           '0%': { 
             transform: 'scale(0.1) rotate(-8deg)',
             opacity: '0'
           },
           '20%': { 
             transform: 'scale(1.2) rotate(2deg)',
             opacity: '0.8'
           },
           '50%': { 
             transform: 'scale(0.9) rotate(-1deg)',
             opacity: '1'
           },
           '80%': { 
             transform: 'scale(1.05) rotate(0.5deg)',
             opacity: '1'
           },
           '100%': { 
             transform: 'scale(1) rotate(0deg)',
             opacity: '1'
           },
         },
         shimmer: {
           '0%': { transform: 'translateX(-100%)' },
           '100%': { transform: 'translateX(100%)' },
         },
       },
      fontFamily: {
        sans: ['-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
      },
      backdropBlur: {
        xs: '2px',
      },
    },
  },
  plugins: [],
} 