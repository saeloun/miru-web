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
        // Mercury-inspired Miru brand colors
        "miru-black-1000": "#0F0F0F",
        "miru-gray-1000": "#8B8B8B",
        "miru-gray-900": "#6B6B6B",
        "miru-gray-800": "#4B4B4B",
        "miru-gray-700": "#3B3B3B",
        "miru-gray-600": "#2B2B2B",
        "miru-gray-500": "#1B1B1B",
        "miru-gray-400": "#F0F0F0",
        "miru-gray-300": "#E5E5E5",
        "miru-gray-200": "#D0D0D0",
        "miru-gray-100": "#F8F8F8",
        "miru-gray-50": "#FAFAFA",
        "miru-white-1000": "#FFFFFF",
        "miru-dark-purple-1000": "#1F2937",
        "miru-dark-purple-600": "#374151",
        "miru-dark-purple-400": "#6B7280",
        "miru-dark-purple-200": "#9CA3AF",
        "miru-dark-purple-100": "#F3F4F6",
        "miru-han-purple-1000": "#5E58F1",
        "miru-han-purple-600": "#4D47E0",
        "miru-han-purple-400": "#7C78F5",
        "miru-han-purple-200": "#9B97F8",
        "miru-han-purple-100": "#E8E7FD",
        "miru-red-400": "#EF4444",
        "miru-red-200": "#FCA5A5",
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
        sans: ["Geist", "ui-sans-serif", "system-ui", "-apple-system", "BlinkMacSystemFont", "Segoe UI", "Roboto", "sans-serif"],
        geist: ["Geist", "ui-sans-serif", "system-ui"],
        "geist-mono": ["Geist Mono", "ui-monospace", "monospace"],
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