/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx,html}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        emare: {
          primary: '#f59e0b',
          dark: '#1f2937',
          darker: '#111827'
        }
      }
    },
  },
  plugins: [],
}
