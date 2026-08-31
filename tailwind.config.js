/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './*.{js,ts,jsx,tsx}', './src/**/*.{js,ts,jsx,tsx}', './components/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        ink: {
          950: '#1A1D21', 900: '#121417', 850: '#15181C', 800: '#1A1D21',
          750: '#1F2227', 700: '#2C2C2C', 600: '#3A3A3A', 500: '#4A4A4A',
        },
        gold: { DEFAULT: '#FF9900', soft: 'rgba(255, 153, 0, 0.1)', ring: 'rgba(255, 153, 0, 0.35)', text: '#FF9900' },
        aqua: { DEFAULT: '#00F0FF', soft: 'rgba(0, 240, 255, 0.1)', ring: 'rgba(0, 240, 255, 0.35)', text: '#00F0FF' },
        funded: { DEFAULT: '#4CAF50', soft: 'rgba(76, 175, 80, 0.1)', ring: 'rgba(76, 175, 80, 0.35)', text: '#4CAF50' },
        size10: { DEFAULT: '#2563eb', soft: 'rgba(37, 99, 235, 0.14)', ring: 'rgba(37, 99, 235, 0.42)', text: '#60a5fa' },
        size25: { DEFAULT: '#3b82f6', soft: 'rgba(59, 130, 246, 0.14)', ring: 'rgba(59, 130, 246, 0.35)', text: '#60a5fa' },
        size25c: { DEFAULT: '#06b6d4', soft: 'rgba(6, 182, 212, 0.14)', ring: 'rgba(6, 182, 212, 0.42)', text: '#22d3ee' },
        size50: { DEFAULT: '#a855f7', soft: 'rgba(168, 85, 247, 0.14)', ring: 'rgba(168, 85, 247, 0.35)', text: '#c084fc' },
        size100: { DEFAULT: '#f59e0b', soft: 'rgba(245, 158, 11, 0.14)', ring: 'rgba(245, 158, 11, 0.35)', text: '#fbbf24' },
        size150: { DEFAULT: '#10b981', soft: 'rgba(16, 185, 129, 0.14)', ring: 'rgba(16, 185, 129, 0.35)', text: '#34d399' },
        loss: { soft: 'rgba(239, 68, 68, 0.14)', text: '#f87171' },
        profit: { soft: 'rgba(76, 175, 80, 0.1)', text: '#4CAF50' },
        premium: {
          bg: '#0B0B0D', card: '#17171C', border: '#2A2A31', gold: '#D4AF37',
          goldSoft: 'rgba(212, 175, 55, 0.08)', goldRing: 'rgba(212, 175, 55, 0.3)', goldText: '#D4AF37',
          funded: '#2ECC71', fundedSoft: 'rgba(46, 204, 113, 0.08)', fundedRing: 'rgba(46, 204, 113, 0.3)', fundedText: '#2ECC71',
          aqua: '#3B82F6', aquaSoft: 'rgba(59, 130, 246, 0.08)', aquaRing: 'rgba(59, 130, 246, 0.3)', aquaText: '#3B82F6',
          white: '#F5F5F5', muted: '#9CA3AF',
        },
      },
      borderRadius: { '2xl': '1rem', '3xl': '1.5rem' },
    },
  },
  plugins: [],
};
