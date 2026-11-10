/** @type {import('tailwindcss').Config} */
// Hybrid theme: the original monochrome palette and display fonts, plus the
// new violet -> pink -> amber accent and glow effects.
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        // original palette
        flashWhite: '#f4f4f6',
        platinum: '#e6e6e9',
        timberWolf: '#d4d4d8',
        silver: '#d6d6d6',
        taupe: '#9999a1',
        battleGray: '#858585',
        french: '#b5b5ba',
        dim: '#66666e',
        onyx: '#5b5b5b',
        jetGray: '#6d6d74',
        jetLight: '#333333',
        jet: '#292929',
        richBlack: '#2e2e2e',
        eerieBlack: '#1f1f1f',
        night: '#141414',
        // new
        ink: { 950: '#0a0a0c', 900: '#111114', 800: '#18181c' },
      },
      fontFamily: {
        // original
        mova: ['Mova', 'sans-serif'],
        beckman: ['Beckman', 'sans-serif'],
        overcame: ['"Overcame Bold"', 'sans-serif'],
        poppins: ['Poppins', 'sans-serif'],
        // new
        display: ['Syne', 'sans-serif'],
        sans: ['"Plus Jakarta Sans Variable"', 'Poppins', 'system-ui', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'ui-monospace', 'monospace'],
      },
      screens: { xs: '450px', xmd: '900px', '3xl': '1800px' },
      boxShadow: {
        card: '0px 35px 120px -15px #1f1f1f',
        glow: '0 10px 40px -10px rgba(236,72,153,0.65)',
      },
      keyframes: {
        marquee: { to: { transform: 'translateX(-50%)' } },
        float: { '0%,100%': { transform: 'translateY(0)' }, '50%': { transform: 'translateY(-10px)' } },
        aurora: {
          '0%,100%': { transform: 'translate(0,0) scale(1)' },
          '33%': { transform: 'translate(8%,-6%) scale(1.1)' },
          '66%': { transform: 'translate(-6%,8%) scale(0.95)' },
        },
        shine: { to: { backgroundPosition: '200% center' } },
        scrollDot: { '0%,100%': { transform: 'translateY(0)' }, '50%': { transform: 'translateY(24px)' } },
      },
      animation: {
        marquee: 'marquee 40s linear infinite',
        float: 'float 6s ease-in-out infinite',
        aurora: 'aurora 22s ease-in-out infinite',
        shine: 'shine 6s linear infinite',
        'scroll-dot': 'scrollDot 1.5s ease-in-out infinite',
      },
    },
  },
  plugins: [],
};
