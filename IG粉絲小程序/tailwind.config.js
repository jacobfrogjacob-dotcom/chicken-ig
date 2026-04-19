/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        'chinese-red': '#8B0000',
        'ink-black': '#1a1a1a',
        'paper': '#f5f0e6',
        'gold': '#D4AF37',
      },
      fontFamily: {
        'calligraphy': ['"Ma Shan Zheng"', 'cursive', 'sans-serif'],
      },
    },
  },
  plugins: [],
}