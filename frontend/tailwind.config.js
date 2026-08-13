/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx,ts,tsx}'],
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#f2f9f8',
          100: '#d8f0ec',
          500: '#0f766e',
          700: '#115e59',
          900: '#134e4a'
        }
      }
    }
  },
  plugins: []
};
