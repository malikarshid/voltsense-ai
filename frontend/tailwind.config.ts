import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: ["class"],
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "#080D18",
        sidebar: "#0B1220",
        card: "#111B2B",
        "secondary-bg": "#172337",
        "primary-green": "#55D889",
        "secondary-green": "#32B96F",
        "electric-blue": "#4C9FFF",
        "warning-yellow": "#F4C44E",
        "critical-red": "#EF6262",
        "primary-text": "#F4F7FB",
        "secondary-text": "#9BA9BB",
        border: "#263449",
      },
      fontFamily: {
        sans: ["Inter", "system-ui", "sans-serif"],
      },
      boxShadow: {
        "glow-green": "0 0 20px -5px rgba(85, 216, 137, 0.35)",
        "glow-blue": "0 0 20px -5px rgba(76, 159, 255, 0.35)",
      },
    },
  },
  plugins: [],
};
export default config;
