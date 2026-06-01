import type { Config } from "tailwindcss";

// Bold & playful redesign: the whole app uses Tailwind's `slate` scale for
// surfaces/text, so remapping it to a deep violet-charcoal instantly re-skins
// every screen. Brand accents are exposed as named colors + CSS-variable tokens.
const config: Config = {
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        // Theme-aware via CSS-variable channels (see globals.css). These flip
        // between dark/light so every hardcoded slate/white utility re-skins.
        white: "rgb(var(--w) / <alpha-value>)",
        slate: {
          50: "rgb(var(--s-50) / <alpha-value>)",
          100: "rgb(var(--s-100) / <alpha-value>)",
          200: "rgb(var(--s-200) / <alpha-value>)",
          300: "rgb(var(--s-300) / <alpha-value>)",
          400: "rgb(var(--s-400) / <alpha-value>)",
          500: "rgb(var(--s-500) / <alpha-value>)",
          600: "rgb(var(--s-600) / <alpha-value>)",
          700: "rgb(var(--s-700) / <alpha-value>)",
          800: "rgb(var(--s-800) / <alpha-value>)",
          900: "rgb(var(--s-900) / <alpha-value>)",
          950: "rgb(var(--s-950) / <alpha-value>)"
        },
        brand: {
          DEFAULT: "#7c5cff",
          50: "#f1edff",
          100: "#e4dcff",
          200: "#cabaff",
          300: "#a98fff",
          400: "#8d6bff",
          500: "#7c5cff",
          600: "#6a45f0",
          700: "#5836c9",
          800: "#422a96",
          900: "#2d1c66"
        },
        coral: {
          DEFAULT: "#ff5c8a",
          400: "#ff7aa3",
          500: "#ff5c8a",
          600: "#ed3d70"
        }
      },
      backgroundImage: {
        "grad-brand": "linear-gradient(135deg, #7c5cff 0%, #ff5c8a 100%)",
        "grad-success": "linear-gradient(135deg, #2dd4bf 0%, #34d399 100%)",
        "grad-warm": "linear-gradient(135deg, #fbbf24 0%, #ff5c8a 100%)"
      },
      boxShadow: {
        pop: "0 18px 50px -12px rgba(124, 92, 255, 0.45)"
      },
      borderRadius: {
        "4xl": "2rem"
      }
    }
  },
  plugins: []
};

export default config;
