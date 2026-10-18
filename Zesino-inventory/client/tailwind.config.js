/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        navy: {
          950: '#07101f',
          900: '#0b1528',
          800: '#12203a',
          700: '#1b2d4d',
        },
        ink: '#101828',
        mute: '#7b8799',
        line: '#e7ebf2',
        canvas: '#f3f5f9',
        brand: {
          DEFAULT: '#3b6dff',
          dark: '#2f5cf0',
          soft: '#eef3ff',
        },
      },
      boxShadow: {
        card: '0 8px 24px rgba(16, 24, 40, 0.04)',
        pop: '0 16px 40px rgba(16, 24, 40, 0.12)',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
};
