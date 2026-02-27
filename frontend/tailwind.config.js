/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        earth: {
          50: "#f3f8f0",
          100: "#dbead2",
          500: "#4b7f52",
          700: "#2d4e31",
          900: "#1a2f1d"
        },
        clay: {
          100: "#f5e8db",
          500: "#b7773d",
          700: "#8a5526"
        }
      },
      boxShadow: {
        soft: "0 12px 40px rgba(26, 47, 29, 0.12)"
      }
    }
  },
  plugins: []
};
