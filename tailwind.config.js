/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        mario: {
          red: '#E53E3E',
          blue: '#3182CE',
          yellow: '#D69E2E',
          green: '#38A169',
          orange: '#DD6B20',
          purple: '#805AD5',
        },
        gem: {
          blue: '#4299E1',
          gold: '#F6E05E',
          silver: '#CBD5E0',
          bronze: '#D69E2E',
        }
      },
      fontFamily: {
        'mario': ['Mario', 'Arial', 'sans-serif'],
      },
      animation: {
        'bounce-gem': 'bounce 0.6s ease-in-out',
        'glow': 'glow 2s ease-in-out infinite alternate',
      },
      keyframes: {
        glow: {
          '0%': { boxShadow: '0 0 5px theme(colors.mario.yellow)' },
          '100%': { boxShadow: '0 0 20px theme(colors.mario.yellow), 0 0 30px theme(colors.mario.yellow)' },
        }
      }
    },
  },
  plugins: [],
}