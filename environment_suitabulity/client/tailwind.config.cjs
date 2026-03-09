/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        marine: {
          50: "#effcf8",
          100: "#d8f7ee",
          200: "#b4ecd9",
          300: "#7fddbf",
          400: "#3ccaa1",
          500: "#16b08b",
          600: "#0c8d72",
          700: "#0b6f5b",
          800: "#0c5748",
          900: "#0b463b"
        }
      },
      boxShadow: {
        soft: "0 10px 30px rgba(2, 44, 34, 0.25)"
      }
    }
  },
  plugins: []
};

