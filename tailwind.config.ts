import type { Config } from "tailwindcss";

// Design tokens for Ultron.
// Palette is a dark base with orange/amber Ultron accents — bold, energetic,
// and inspired by the Marvel character's visual identity.
const config: Config = {
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        base: {
          bg: "#0A0C10", // app background - darker for Ultron feel
          surface: "#12151A", // cards, sidebar, input shell
          raised: "#1A1E24", // hovered / active surface
          border: "#252930",
        },
        ink: {
          primary: "#E8EAED",
          muted: "#8C9199",
          faint: "#5C6169",
        },
        ultron: {
          // Single primary accent used for interactive elements — Ultron orange/amber.
          DEFAULT: "#FF6B35",
          hover: "#FF8555",
          glow: "#FF8C42",
        },
        // The three-stop spectrum is reserved for exactly one decorative
        // moment (see .ultron-edge in globals.css) — orange to red to amber.
        spectrum: {
          from: "#FF6B35",
          mid: "#FF4500",
          to: "#FF8C42",
        },
      },
      fontFamily: {
        sans: ["var(--font-inter)", "system-ui", "sans-serif"],
        mono: ["var(--font-mono)", "ui-monospace", "monospace"],
      },
      borderRadius: {
        md: "10px",
        lg: "14px",
      },
    },
  },
  plugins: [],
};

export default config;
