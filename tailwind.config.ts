import type { Config } from "tailwindcss";

// Bold & playful redesign: the whole app uses Tailwind's `slate` scale for
// surfaces/text, so remapping it to a deep violet-charcoal instantly re-skins
// every screen. Brand accents are exposed as named colors + CSS-variable tokens.
const config: Config = {
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        slate: {
          50: "#f4f3ff",
          100: "#eceaff",
          200: "#d6d2f5",
          300: "#b3aee0",
          400: "#8d88bf",
          500: "#6f6a9c",
          600: "#4f4a78",
          700: "#363158",
          800: "#241f44",
          900: "#16132e",
          950: "#0a0a1a"
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
