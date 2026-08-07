import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class",
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./lib/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        ink: "#10151F",
        surface: "#171E2C",
        "surface-raised": "#1D2536",
        border: "#2A3344",
        "text-primary": "#E7ECF3",
        "text-muted": "#8B96A8",
        notify: {
          DEFAULT: "#22D3A6",
          dim: "#163B33",
        },
        digest: {
          DEFAULT: "#F5A524",
          dim: "#3D2E11",
        },
        mute: {
          DEFAULT: "#FB5B6E",
          dim: "#3C1820",
        },
      },
      fontFamily: {
        display: ["var(--font-display)", "sans-serif"],
        body: ["var(--font-body)", "sans-serif"],
        mono: ["var(--font-mono)", "monospace"],
      },
      borderRadius: {
        card: "0.875rem",
      },
    },
  },
  plugins: [],
};

export default config;