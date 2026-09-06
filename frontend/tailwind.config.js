/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{ts,tsx,js,jsx}"],
  theme: {
    extend: {
      colors: {
        brand: {
          lam: { DEFAULT: "#3b82f6", 50: "#eff6ff", 100: "#dbeafe", 200: "#bfdbfe", 300: "#93c5fd", 400: "#60a5fa", 500: "#3b82f6", 600: "#2563eb", 700: "#1d4ed8", 800: "#1e40af", 900: "#1e3a8a" },
          dat: { DEFAULT: "#d97706", 50: "#fffbeb", 100: "#fef3c7", 200: "#fde68a", 300: "#fcd34d", 400: "#fbbf24", 500: "#f59e0b", 600: "#d97706", 700: "#b45309", 800: "#92400e", 900: "#78350f" },
        },
        ceramic: {
          50: "#fdf8f3",
          100: "#f7ecdf",
          200: "#efe2cc",
          500: "#b0722f",
          700: "#7d4f1d",
          900: "#3f2810",
        },
        bg: {
          DEFAULT: "#f8f9fa",
          paper: "#ffffff",
        },
        ink: {
          DEFAULT: "#26221b",
          soft: "#5b554a",
          faint: "#8a8173",
          light: "#eae5dc",
        },
        men: {
          50: "#eff6ff",
          100: "#dbeafe",
          200: "#bfdbfe",
          300: "#93c5fd",
          400: "#60a5fa",
          500: "#3b82f6",
          600: "#2563eb",
          700: "#1d4ed8",
          800: "#1e40af",
          900: "#1e3a8a",
        },
        dat: {
          50: "#fffbeb",
          100: "#fef3c7",
          200: "#fde68a",
          300: "#fcd34d",
          400: "#fbbf24",
          500: "#f59e0b",
          600: "#d97706",
          700: "#b45309",
          800: "#92400e",
          900: "#78350f",
        },
        cream: {
          50: "#fdfaf5",
          100: "#f7f0e3",
          200: "#efe2cc",
          300: "#e2cfab",
          400: "#d4c5b4",
        },
        border: {
          DEFAULT: "rgba(38,34,27,0.1)",
          soft: "rgba(38,34,27,0.06)",
        },
      },
      fontFamily: {
        sans: ['"Inter"', "system-ui", "sans-serif"],
      },
      boxShadow: {
        card: "0 1px 2px rgba(38,34,27,0.06), 0 4px 12px rgba(38,34,27,0.06)",
        pop: "0 8px 30px rgba(38,34,27,0.14)",
        input: "0 1px 0 rgba(38,34,27,0.03)",
        elevated: "0 4px 20px rgba(38,34,27,0.08)",
      },
      borderRadius: {
        sm: "8px",
        md: "12px",
        lg: "16px",
        "2xl": "20px",
        full: "9999px",
      },
      transitionDuration: {
        fast: "150ms",
        normal: "250ms",
        slow: "350ms",
      },
      transitionTimingFunction: {
        easeOut: "cubic-bezier(0.02, 0.01, 0.47, 1)",
        easeInOut: "cubic-bezier(0.4, 0, 0.2, 1)",
      },
    },
  },
  plugins: [],
};
