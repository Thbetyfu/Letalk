/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        // Brand colors Letalk
        letalk: {
          50: '#f5f3ff',
          100: '#ede9fe',
          200: '#ddd6fe',
          300: '#c4b5fd',
          400: '#a78bfa',
          500: '#8b5cf6',
          600: '#7c3aed',  // PRIMARY
          700: '#6d28d9',
          800: '#5b21b6',
          900: '#4c1d95',
        },
        mediator: {
          // Warna khusus elemen AI mediator
          bg: '#f0fdf4',
          text: '#166534',
          border: '#86efac',
        }
      },
      animation: {
        'wave': 'wave 2s ease-in-out infinite',
        'float': 'float 3s ease-in-out infinite',
      },
      keyframes: {
        wave: {
          '0%, 100%': { transform: 'scaleY(1)' },
          '50%': { transform: 'scaleY(1.5)' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-8px)' },
        }
      }
    },
  },
  plugins: [],
};
