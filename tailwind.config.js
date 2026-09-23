export default {
  content: ['./app/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        paper: '#FAF6F4',
        ink: {
          DEFAULT: '#1E1614',
          soft: '#5B4F4C',
          faint: '#8E817E',
        },
        line: '#ECE2DF',
        brand: {
          50: '#FFF4F2',
          100: '#FFE4E0',
          200: '#FDCBC4',
          300: '#F9A298',
          400: '#F1675B',
          500: '#E23B2E',
          600: '#C9261A',
          700: '#A31C13',
          800: '#7D170F',
          900: '#55100A',
        },
        warn: {
          50: '#FFF8EB',
          100: '#FDEFD3',
          500: '#D9901A',
          700: '#8F5606',
        },
        ok: {
          50: '#EFF8F3',
          100: '#DDF0E5',
          500: '#2F9463',
          700: '#1F6B46',
        },
      },
      fontFamily: {
        sans: ['Manrope', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        'glow-sm': '0 6px 16px -6px rgba(201, 38, 26, 0.55)',
        glow: '0 12px 32px -10px rgba(201, 38, 26, 0.55)',
      },
    },
  },
};
