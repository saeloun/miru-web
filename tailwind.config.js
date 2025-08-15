/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{html,js,jsx,ts,tsx,erb}",
    "./app/javascript/**/*.{js,jsx,ts,tsx}",
    "./public/**/*.html"
  ],
  prefix: "",
  theme: {
    container: {
      center: true,
      padding: "2rem",
      screens: {
        "2xl": "1400px",
      },
    },
    extend: {
      colors: {
        // shadcn/ui color system
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        // Miru brand colors for backward compatibility
        "miru-black-1000": "#303A4B",
        "miru-gray-1000": "#CDD6DF",
        "miru-gray-600": "#D7DEE5",
        "miru-gray-400": "#E1E6EC",
        "miru-gray-200": "#EBEFF2",
        "miru-gray-100": "#F5F7F9",
        "miru-gray-500": "#ADA4CE",
        "miru-gray-800": "#ADA4CE",
        "miru-white-1000": "#FFFFFF",
        "miru-dark-purple-1000": "#1D1A31",
        "miru-dark-purple-600": "#4A485A",
        "miru-dark-purple-400": "#777683",
        "miru-dark-purple-200": "#A5A3AD",
        "miru-dark-purple-100": "#D2D1D6",
        "miru-han-purple-1000": "#5B34EA",
        "miru-han-purple-600": "#7C5DEE",
        "miru-han-purple-400": "#9D85F2",
        "miru-han-purple-200": "#BDAEF7",
        "miru-han-purple-100": "#DED6FB",
        "miru-red-400": "#E04646",
        "miru-red-200": "#EB5B5B",
        // Chart colors
        "miru-chart-green": {
          600: "#10B981",
        },
        "miru-chart-blue": {
          600: "#3B82F6",
        },
        "miru-chart-pink": {
          600: "#EC4899",
        },
        "miru-chart-orange": {
          600: "#F59E0B",
        },
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
        sidebar: {
          DEFAULT: "hsl(var(--sidebar))",
          foreground: "hsl(var(--sidebar-foreground))",
          primary: "hsl(var(--sidebar-primary))",
          "primary-foreground": "hsl(var(--sidebar-primary-foreground))",
          accent: "hsl(var(--sidebar-accent))",
          "accent-foreground": "hsl(var(--sidebar-accent-foreground))",
          border: "hsl(var(--sidebar-border))",
          ring: "hsl(var(--sidebar-ring))",
        },
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      keyframes: {
        "accordion-down": {
          from: { height: "0" },
          to: { height: "var(--radix-accordion-content-height)" },
        },
        "accordion-up": {
          from: { height: "var(--radix-accordion-content-height)" },
          to: { height: "0" },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
      },
      fontFamily: {
        sans: ["Inter", "ui-sans-serif", "system-ui", "-apple-system", "BlinkMacSystemFont", "Segoe UI", "Roboto", "sans-serif"],
        manrope: ["Manrope", "serif"],
      },
      fontSize: {
        tiny: "0.625rem",
        xxs: "0.688rem",
      },
      spacing: {
        22: "5.5rem",
        xxl: "8rem",
      },
      maxWidth: {
        400: "25rem",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
  safelist: [
    // Chart colors to ensure they're always included
    "bg-miru-chart-green-600",
    "bg-miru-chart-blue-600",
    "bg-miru-chart-pink-600",
    "bg-miru-chart-orange-600",
  ],
};