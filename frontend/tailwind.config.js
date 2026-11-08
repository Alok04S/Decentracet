/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        background: "#F7F9FC",
        surface: "#FFFFFF",
        primary: {
          DEFAULT: "#2563EB", // Primary Blue
          hover: "#1D4ED8",
          surface: "#EFF6FF", // Light Blue Surface
        },
        navy: {
          DEFAULT: "#172B4D", // Deep Navy Text
          muted: "#334155",
        },
        secondary: {
          DEFAULT: "#64748B", // Secondary Slate Text
          light: "#94A3B8",
        },
        border: "#E2E8F0",
        success: {
          DEFAULT: "#16A34A",
          surface: "#F0FDF4",
          border: "#BBF7D0",
        },
        warning: {
          DEFAULT: "#D97706",
          surface: "#FFFBEB",
          border: "#FDE68A",
        },
        error: {
          DEFAULT: "#DC2626",
          surface: "#FEF2F2",
          border: "#FECACA",
        },
      },
      fontFamily: {
        sans: ["Inter", "-apple-system", "BlinkMacSystemFont", "Segoe UI", "Roboto", "sans-serif"],
      },
      borderRadius: {
        DEFAULT: "8px",
        md: "10px",
        lg: "12px",
      },
      boxShadow: {
        subtle: "0 1px 3px 0 rgba(0, 0, 0, 0.05), 0 1px 2px 0 rgba(0, 0, 0, 0.03)",
        card: "0 2px 6px -1px rgba(0, 0, 0, 0.06), 0 2px 4px -1px rgba(0, 0, 0, 0.04)",
        elevated: "0 10px 15px -3px rgba(0, 0, 0, 0.06), 0 4px 6px -2px rgba(0, 0, 0, 0.03)",
      },
    },
  },
  plugins: [],
};
