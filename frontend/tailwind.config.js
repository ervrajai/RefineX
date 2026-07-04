/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}", // Make sure this matches your folder structure
  ],
  theme: {
    extend: {
      colors: {
        black: '#000000',
        white: '#ffffff',
        borderGray: '#cdcdcd',
        primary: '#673ab7',
        primaryDark: '#522e93',
      },
    },
  },
  plugins: [],
}