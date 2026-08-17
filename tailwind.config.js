/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './constants/**/*.{js,ts,jsx,tsx,mdx}'
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          greenDark: '#1b532b',
          greenLeaf: '#498a28',
          gold: '#c39a2b',
          terracotta: '#cc6d43',
          cream: '#f9f7f2',
          muted: '#6e7570',
        },
      },
      boxShadow: {
        brand: '0 12px 35px rgba(27, 83, 43, 0.06)',
      },
    },
  },
  plugins: [],
};