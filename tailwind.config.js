/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,ts,jsx,tsx,mdx}", // This covers app, components, and lib
  ],
  theme: {
    extend: {
      colors: {
        // These colors are used in your homepage code
        primary: "#000000", 
        secondary: "#F5F5F5",
        "accent-100": "#ffa500", // The orange/gold color in your UI
      },
      fontFamily: {
        heading: ["var(--font-quicksand)", "sans-serif"],
        body: ["var(--font-heebo)", "sans-serif"],
      },
    },
  },
  plugins: [
    require('@tailwindcss/typography'),
    require('@tailwindcss/container-queries'), // Required for @container class
  ],
}