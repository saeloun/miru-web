module.exports = {
  purge: [],
  darkMode: false, // or 'media' or 'class'
  theme: {
    container: {
      center: true
    },
    fontSize: {
      'xs': '.75rem',
      'sm': '.875rem',
      'tiny': '.875rem',
      'base': '1rem',
      'lg': '1.125rem',
      'xl': '1.25rem',
      '2xl': '1.5rem',
      '3xl': '1.875rem',
      '4xl': '2.25rem',
      '4.5xl': '2.5rem',
      '5xl': '3rem',
      '6xl': '4rem',
      '7xl': '5rem',
    },
    letterSpacing: {
      widest: "0.125rem",
      wider: ".05rem",
      normal: "0"
    },
    screens: {
      xsm: "380px",
      sm: "640px",
      md: "768px",
      lg: "1024px",
      xl: "1280px",
      xxl: "1536px"
    },
    extend: {
      margin: {
        86: "342px"
      },
      colors: {
        "miru-black": {
          1000: "#303A4B"
        },
        "miru-gray": {
          1000: "#CDD6DF",
          600: "#D7DEE5",
          400: "#E1E6EC",
          200: "#EBEFF2",
          100: "#F5F7F9"
        },
        "miru-white": {
          1000: "#FFFFFF"
        },
        "miru-dark-purple": {
          1000: "#1D1A31",
          600: "#4A485A",
          400: "#777683",
          200: "#A5A3AD",
          100: "#D2D1D6"
        },
        "miru-han-purple": {
          1000: "#5B34EA",
          600: "#7C5DEE",
          400: "#9D85F2",
          200: "#BDAEF7",
          100: "#DED6FB"
        },
        "miru-alert-green": {
          1000: "#564210",
          800: "#10562C",
          400: "#A9EFC5"
        },
        "miru-alert-pink": {
          400: "#EFA9A9"
        },
        "miru-alert-blue": {
          1000: "#104556",
          400: "#A9DEEF"
        },
        "miru-alert-yellow": {
          400: "#EFDBA9"
        },
        "miru-alert-red": {
          1000: "#561010"
        },
        "miru-chart-green": {
          600: "#058C42",
          400: "#0DA163"
        },
        "miru-chart-blue": {
          600: "#0E79B2"
        },
        "miru-chart-pink": {
          600: "#BF1363"
        },
        "miru-chart-orange": {
          600: "#F39237"
        },
        "miru-chart-purple": {
          600: "#7768AE"
        }
      },
      fontFamily: {
        manrope: "'Manrope', serif"
      },
      spacing: {
        13: "3.125rem",
        18: "4.5rem",
        19: "4.75rem",
        22: "5.5rem",
        25: "6.25rem",
        26: "6.5rem",
        29: "7.25rem",
        38: "9.5rem",
        50: "12.5rem",
        112: "28rem"
      },
      padding: {
        "36/100": "36.66666%",
        "32/100": "32.66666%",
        "30/100": "30%",
        "26/100": "26.66666%",
        "20/100": "20%",
        "10/100": "10%"
      }
    }
  },
  boxShadow: {
    c1: "0 1px 3px rgba(0,0,0,0.12), 0 1px 2px rgba(0,0,0,0.24); transition: all 0.3s cubic-bezier(.25,.8,.25,1);"
  },
  variants: {
    extend: {
      display: ["group-hover"],
    }
  },
  plugins: []
};
