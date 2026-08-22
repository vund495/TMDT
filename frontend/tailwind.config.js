/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        ceramic: {
          50: "#fdf8f3",
          100: "#f7ecdf",
          500: "#b0722f",
          700: "#7d4f1d",
          900: "#3f2810",
        },
      },
    },
  },
  plugins: [],
};
