/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        brand: {
          gold: "#f7cf70",
          goldDark: "#9a6d12",
          emerald: "#26e28c",
          neon: "#22d3ee"
        }
      },
      boxShadow: {
        glow: "0 0 24px rgba(34, 211, 238, 0.28)",
        gold: "0 0 20px rgba(247, 207, 112, 0.35)"
      },
      backgroundImage: {
        "gold-frame":
          "linear-gradient(140deg, #8a5b10 0%, #f7cf70 30%, #7b5310 50%, #f4e0a9 72%, #a56e13 100%)"
      },
      animation: {
        pulseSoft: "pulseSoft 1.6s ease-in-out infinite"
      },
      keyframes: {
        pulseSoft: {
          "0%, 100%": { opacity: "1", transform: "scale(1)" },
          "50%": { opacity: "0.72", transform: "scale(0.97)" }
        }
      }
    }
  },
  plugins: []
};
