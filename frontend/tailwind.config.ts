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
        background: "var(--bg-main)",
        sidebar: "var(--bg-sidebar)",
        "surface-primary": "var(--bg-surface)",
        card: "var(--bg-surface)",
        "surface-secondary": "var(--bg-surface-secondary)",
        "secondary-bg": "var(--bg-surface-secondary)",
        "surface-elevated": "var(--bg-surface-elevated)",
        border: "var(--border-color)",
        "text-primary": "var(--text-primary)",
        "primary-text": "var(--text-primary)",
        "text-secondary": "var(--text-secondary)",
        "secondary-text": "var(--text-secondary)",
        "text-muted": "var(--text-muted)",
        "accent-primary": "var(--accent-primary)",
        "primary-green": "var(--accent-primary)",
        "secondary-green": "var(--accent-primary)",
        "accent-secondary": "var(--accent-secondary)",
        "electric-blue": "var(--accent-secondary)",
        "status-info": "var(--status-info)",
        "status-warning": "var(--status-warning)",
        "warning-yellow": "var(--status-warning)",
        "status-critical": "var(--status-critical)",
        "critical-red": "var(--status-critical)",
        "status-success": "var(--status-success)",
      },
      borderRadius: {
        sm: "6px",
        card: "10px",
        container: "12px",
      },
      fontFamily: {
        sans: ["Inter", "-apple-system", "BlinkMacSystemFont", "Segoe UI", "sans-serif"],
        mono: ["GeistMono", "ui-monospace", "SFMono-Regular", "Menlo", "Monaco", "Consolas", "monospace"],
      },
      boxShadow: {
        subtle: "var(--card-shadow)",
        elevated: "var(--elevated-shadow)",
        none: "none",
      },
    },
  },
  plugins: [],
};
export default config;
