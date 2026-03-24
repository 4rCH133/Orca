/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./app/**/*.{js,jsx,ts,tsx}', './src/**/*.{js,jsx,ts,tsx}'],
  presets: [require('nativewind/preset')],
  theme: {
    extend: {
      colors: {
        // Orca design system
        base: '#000000',
        surface: '#0D0D0E',
        elevated: '#161617',
        input: '#1A1A1B',
        subtle: '#1E1E1F',
        border: '#2A2A2B',
        // Text
        primary: '#F0F0F0',
        secondary: '#A8A8A8',
        muted: '#5A5A5C',
        // Accent
        orange: '#FF4500',
        blue: '#7193FF',
        green: '#46D160',
        gold: '#FFB000',
      },
    },
  },
  plugins: [],
};
