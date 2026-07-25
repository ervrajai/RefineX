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
        
        // RefineX Dark Theme Backgrounds (Reduced Eye Strain)
        darkBg: '#0F0F0F',
        panel: '#212121',
        elevated: '#212121',
        hover: '#272727',
        panelHover: '#272727',

        // RefineX Light Theme Backgrounds (Reduced Eye Strain)
        lightBg: '#FFFFFF',
        lightElevated: '#F2F2F2',
        lightHover: '#E5E5E5',
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