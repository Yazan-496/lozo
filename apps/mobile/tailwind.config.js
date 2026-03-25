/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './App.tsx',
    './src/**/*.{ts,tsx}',
  ],
  presets: [require('nativewind/preset')],
  theme: {
    extend: {
      colors: {
        primary: '#0084FF',
        secondary: '#E4E6EB',
        dark: '#1C1E21',
        gray: {
          50: '#F0F2F5',
          100: '#E4E6EB',
          200: '#D8DADF',
          300: '#BCC0C4',
          400: '#8A8D91',
          500: '#65676B',
          600: '#444950',
          700: '#303338',
          800: '#242526',
          900: '#18191A',
        },
      },
    },
  },
  plugins: [],
};
