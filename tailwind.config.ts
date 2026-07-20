import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: ["class"],
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        void: "#020604",
        abyss: "#031009",
        surface: {
          DEFAULT: "rgba(3, 20, 11, 0.64)",
          strong: "rgba(5, 31, 17, 0.82)",
          hairline: "rgba(53, 255, 122, 0.12)",
        },
        steam: {
          DEFAULT: "#35ff7a",
          deep: "#16c957",
          dim: "#0b3a22",
        },
        unlocked: "#35ff7a",
        locked: "#5b7764",
        rarity: {
          common: "#8aa995",
          uncommon: "#35ff7a",
          rare: "#25dc68",
          veryrare: "#70ffa0",
          ultrarare: "#b5ffce",
        },
        warn: "#facc15",
        danger: "#fb7185",
      },
      fontFamily: {
        display: ["var(--font-sora)", "sans-serif"],
        body: ["var(--font-inter)", "sans-serif"],
        mono: ["var(--font-jbmono)", "monospace"],
      },
      backdropBlur: { xs: "2px", glass: "20px" },
      boxShadow: {
        glass: "0 8px 32px 0 rgba(0, 0, 0, 0.52)",
        "glass-inset": "inset 0 1px 0 0 rgba(127,255,168,0.07)",
        glow: "0 0 42px -8px rgba(53, 255, 122, 0.42)",
      },
      borderRadius: { xl2: "1.25rem" },
      backgroundImage: {
        "mesh-glow":
          "radial-gradient(60% 50% at 15% 10%, rgba(53,255,122,0.15) 0%, transparent 60%), radial-gradient(50% 40% at 85% 0%, rgba(27,205,91,0.10) 0%, transparent 60%), radial-gradient(60% 60% at 50% 100%, rgba(77,255,139,0.08) 0%, transparent 60%)",
      },
      keyframes: {
        drift: {
          "0%, 100%": { transform: "translate(0, 0)" },
          "50%": { transform: "translate(2%, 3%)" },
        },
      },
      animation: { drift: "drift 18s ease-in-out infinite" },
    },
  },
  plugins: [require("tailwindcss-animate")],
};

export default config;
