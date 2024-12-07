module.exports = {
  purge: [
    "./app/**/*.html.erb",
    "./app/helpers/**/*.rb",
    "./app/javascript/**/*.js",
  ],
  darkMode: false, // or 'media' or 'class'
  theme: {
    container: {
      center: true,
    },
    listStyleType: {
      lower: "lower-alpha",
      decimal: "decimal",
    },
    fontSize: {
      xsm: ".5625em",
      xxs: "0.625rem", //10px
      xs: ".75rem",
      sm: ".875rem",
      tiny: ".875rem",
      base: "1rem",
      lg: "1.125rem",
      xl: "1.25rem",
      "2xl": "1.5rem",
      "3xl": "1.875rem",
      "3.5xl": "2rem",
      "4xl": "2.25rem",
      "4.5xl": "2.5rem",
      "4.75xl": "2.75rem",
      "5xl": "3rem",
      "6xl": "4rem",
      "7xl": "5rem",
      32: "2rem",
    },
    letterSpacing: {
      2: "2px",
      widest: "0.125em",
      semiWidest: "0.09375", //1.5px
      wider: ".05em",
      normal: "0em",
      "xs-widest": "0.166667em", // 2px when font-size 12px
    },
    screens: {
      xsm: "380px",
      sm: "640px",
      md: "768px",
      lg: "1024px",
      xl: "1280px",
      xxl: "1536px",
    },
    extend: {
      boxShadow: {
        c1: "0px 0px 40px rgba(0, 0, 0, 0.1);",
      },
      lineHeight: {
        5.5: "22px",
      },
      margin: {
        86: "342px",
      },
      width: {
        fit: "fit-content",
        30: "7.5rem", //120px
        34: "8.6rem",
        13: "13.5px",
        88: "5.5rem", //88px
        128: "32rem", // 512px
        168: "10.5rem", // 168px
        180: "11.25rem", //180px
        228: "14.25rem", //228px
        300: "18.75rem", //300px
        320: "20rem", // 320px
        336: "21rem", // 336px
        352: "22rem", //352px
        480: "30rem", //480px
        18: "18%",
        72: "72%",
        "12/25": "48%",
        "1/10": "10%",
        "1/15": "15%",
      },
      minWidth: {
        12: "12px",
        24: "24px",
        400: "25rem", // 400px
        1008: "1008px",
        "50v": "50vw",
        "60v": "60vw",
        "70v": "70vw",
        "80v": "80vw",
        "90v": "90vw",
        "100v": "100vw",
      },
      maxWidth: {
        400: "25rem", //400px
      },
      height: {
        120: "120px",
        160: "40rem",
        512: "32rem",
        304: "19rem",
        87: "5.4rem",
        88: "5.5rem",
        "14/100": "14%",
        "1/10": "10%",
        "1/12": "8.333%",
        "1/15": "6.666%",
        148: "592px",
        "80v": "80vh",
        "90v": "90vh",
      },
      minHeight: {
        "10v": "10vh",
        "20v": "20vh",
        "30v": "30vh",
        "40v": "40vh",
        "50v": "50vh",
        "60v": "60vh",
        "70v": "70vh",
        "80v": "80vh",
        "90v": "90vh",
        "100v": "100vh",
        24: "24px",
        80: "80px",
      },
      maxHeight: {
        "10v": "10vh",
        "20v": "20vh",
        "30v": "30vh",
        "40v": "40vh",
        "50v": "50vh",
        "60v": "60vh",
        "70v": "70vh",
        "80v": "80vh",
        "90v": "90vh",
        "100v": "100vh",
      },
      colors: {
        "miru-black": {
          1000: "#303A4B",
        },
        "miru-gray": {
          1000: "#CDD6DF",
          600: "#D7DEE5",
          400: "#E1E6EC",
          200: "#EBEFF2",
          100: "#F5F7F9",
          500: "#ADA4CE",
          800: "#ADA4CE",
          50: "#CDD6DF33",
        },
        "miru-white": {
          1000: "#FFFFFF",
        },
        "miru-dark-purple": {
          1000: "#1D1A31",
          600: "#4A485A",
          400: "#777683",
          200: "#A5A3AD",
          100: "#D2D1D6",
        },
        "miru-han-purple": {
          1000: "#5B34EA",
          600: "#7C5DEE",
          400: "#9D85F2",
          200: "#BDAEF7",
          100: "#DED6FB",
        },
        "miru-alert-green": {
          1000: "#564210",
          800: "#10562C",
          400: "#A9EFC5",
        },
        "miru-alert-pink": {
          400: "#EFA9A9",
        },
        "miru-alert-blue": {
          1000: "#104556",
          400: "#A9DEEF",
        },
        "miru-alert-yellow": {
          400: "#EFDBA9",
        },
        "miru-alert-red": {
          1000: "#561010",
        },
        "miru-chart-green": {
          600: "#058C42",
          400: "#0DA163",
        },
        "miru-chart-blue": {
          600: "#0E79B2",
          1000: "#68AEAA",
        },
        "miru-chart-pink": {
          600: "#BF1363",
        },
        "miru-chart-orange": {
          600: "#F39237",
        },
        "miru-chart-purple": {
          600: "#7768AE",
        },
        "miru-report-purple": {
          600: "#3111A6",
          400: "#8062EF",
        },
        "miru-red": {
          400: "#E04646",
          200: "#EB5B5B",
        },
      },
      fontFamily: {
        manrope: "'Manrope', serif",
      },
      spacing: {
        0.25: "0.0625rem",
        2.125: "0.5625rem",
        3.75: "0.9375rem",
        10.05: "2.565rem",
        13: "3.125rem",
        15: "3.75rem",
        18: "4.5rem",
        19: "4.75rem",
        22: "5.5rem",
        25: "6.25rem",
        26: "6.5rem",
        29: "7.25rem",
        30: "7.5rem",
        34: "8.5rem",
        38: "9.5rem",
        50: "12.5rem",
        54: "13.5rem",
        57.5: "14.375rem",
        104: "26rem",
        112: "28rem",
        129: "33rem",
        138: "34.5rem",
        160: "40rem",
        "1/5": "20%",
      },
      padding: {
        "36/100": "36.66666%",
        "32/100": "32.66666%",
        "30/100": "30%",
        "26/100": "26.66666%",
        "20/100": "20%",
        "15/100": "15%",
        "10/100": "10%",
        "5/100": "5%",
        "2/100": "2%",
        "1/100": "1%",
        "10vh": "10vh",
        "5vh": "5vh",
        "2vh": "2vh",
        "1vh": "1vh",
      },
      zIndex: {
        "negative-1": "-1",
        1: "1",
        15: "15",
        60: "60",
        max: "100",
      },
      transformOrigin: {
        0: "0%",
      },
      inset: {
        "-10": "-10px",
      },
    },
  },
  boxShadow: {
    c1: "0 1px 3px rgba(0,0,0,0.12), 0 1px 2px rgba(0,0,0,0.24); transition: all 0.3s cubic-bezier(.25,.8,.25,1);",
  },
  variants: {
    extend: {
      display: ["group-hover"],
    },
    opacity: ({ after }) => after(["disabled"]),
  },
  plugins: [],
  content: ["./public/**/*.html", "./src/**/*.{js,jsx,ts,tsx}", "!./docs/**/*"],
};
