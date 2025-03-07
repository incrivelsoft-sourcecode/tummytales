/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}", // Ensures Tailwind scans all React component files
    "./public/index.html" // Include HTML files if applicable
  ],
  theme: {
    extend: {}, // You can customize colors, spacing, etc., here
  },
  plugins: [],
};
