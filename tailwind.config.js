/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: "class",
  content: [
  "./app/**/*.{js,ts,jsx,tsx,mdx}",
  "./pages/**/*.{js,ts,jsx,tsx,mdx}",
  "./components/**/*.{js,ts,jsx,tsx,mdx}",
  "./src/**/*.{js,ts,jsx,tsx,mdx,html}",
],
  theme: {
    extend: {
      colors: {
        // ---- CSS variable tokens (from file 1)
        bg: "rgb(var(--bg) / <alpha-value>)",
        fg: "rgb(var(--fg) / <alpha-value>)",
        primary: "rgb(var(--primary) / <alpha-value>)",
        secondary: "rgb(var(--secondary) / <alpha-value>)",
        border: "rgb(var(--border) / <alpha-value>)",
        muted: "rgb(var(--muted) / <alpha-value>)",
        menu: "rgb(var(--menu) / <alpha-value>)",
        icon: "rgb(var(--icon) / <alpha-value>)",

        // ---- Palette (from file 2) renamed to avoid conflict with `primary`
        brand: {
          50: "#DEEAFC",
          100: "#C2D8FA",
          200: "#84B1F5",
          300: "#4286F0",
          400: "#1262DE",
          500: "#0D47A1",
          600: "#0A387F",
          700: "#082A5E",
          800: "#051D42",
          900: "#030F21",
        },
        grayscale: {
          50: "#F3F4F5",
          100: "#E7E8EA",
          200: "#D2D4D9",
          300: "#BBBEC5",
          400: "#A6ABB4",
          500: "#9197A1",
          600: "#72777F",
          700: "#54575D",
          800: "#393C40",
          900: "#1E2022",
          950: "#121315",
        },
      },
      borderRadius: {
        brand: "var(--radius)",
      },
      screens: {
        xs: "375px",
        sm: "640px",
        md: "1024px",
        lg: "1280px",
        xl: "1536px",
      },
    },

    container: {
      center: true,
      padding: {
        DEFAULT: "1rem",
        sm: "16px",
        md: "44px",
        lg: "48px",
        xl: "64px",
      },
      screens: {
        sm: "640px",
        md: "1024px",
        lg: "1280px",
        xl: "1536px",
      },
    },
  },
  plugins: [],
};
