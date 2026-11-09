import type { Config } from "tailwindcss";
export default {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        sans: ["var(--font-sans)", "system-ui", "sans-serif"],
        serif: ["var(--font-serif)", "Georgia", "serif"],
      },
      colors: {
        ink: { 50: "#f6f7f9", 100: "#eceef2", 200: "#d5d9e0", 300: "#b0b7c3", 400: "#848da0", 500: "#646d82", 600: "#4f576a", 700: "#414756", 800: "#383d49", 900: "#1f222a", 950: "#13151a" },
      },
    },
  },
  plugins: [],
} satisfies Config;
