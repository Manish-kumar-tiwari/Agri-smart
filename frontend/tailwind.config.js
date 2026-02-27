/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        earth: {
          50: "#eef4ef",
          100: "#d7e3d6",
          200: "#c2d3c0",
          500: "#5aa97b",
          700: "#2f7f5a",
          900: "#1f4d3a"
        },
        clay: {
          100: "#e8efe7",
          500: "#6aab84",
          700: "#2f7f5a"
        }
      },
      boxShadow: {
        soft: "0 12px 40px rgba(26, 47, 29, 0.12)"
      }
    }
  },
  plugins: []
};
