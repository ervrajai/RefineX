/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        // Standard
        black: '#000000',
        white: '#ffffff',
        
        // RefineX Core Brand
        brand: '#673ab7',
        brandDark: '#522e93',
        
        // RefineX Borders & UI
        lightBorder: '#cdcdcd',
        borderDark: '#1f1f1f',
        
        // RefineX Dark Theme Backgrounds
        darkBg: '#05020a',
        panel: '#111111',
      },
      fontFamily: {
        // Base font for paragraphs and UI text
        sans: ['Inter', 'sans-serif'],
        // Display font for headings and dashboard numbers
        display: ['Orbitron', 'sans-serif'],
        // Accent font if needed (from previous iterations)
        slab: ['"Alfa Slab One"', 'cursive'],
      },
    },
  },
  plugins: [],
}