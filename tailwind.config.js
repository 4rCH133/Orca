/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./app/**/*.{js,jsx,ts,tsx}', './src/**/*.{js,jsx,ts,tsx}'],
  presets: [require('nativewind/preset')],
  theme: {
    extend: {
      colors: {
        reddit: {
          orange: '#FF4500',
          blue: '#0079D3',
          green: '#46D160',
          red: '#FF585B',
        },
        surface: {
          DEFAULT: '#FFFFFF',
          dark: '#1A1A1B',
          elevated: '#F6F7F8',
          'elevated-dark': '#272729',
        },
      },
    },
  },
  plugins: [],
};
