/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,jsx}"
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
      },
      colors: {
        primary: '#2563eb', // azul moderno
        secondary: '#1e40af',
        accent: '#38bdf8',
      }
    },
  },
  darkMode: "class",
  plugins: [],
}
