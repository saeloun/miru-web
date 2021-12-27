module.exports = {
  purge: [],
  darkMode: false, // or 'media' or 'class'
  theme: {
    screens: {
      'xsm': '380px',
      'sm': '640px',
      'md': '768px',
      'lg': '1024px',
      'xl': '1280px',
      '2xl': '1536px'
    },
    extend: {
      colors: {
        mirublack: {
          1000: "#303A4B",
        },
        mirugrey: {
          200: "#F5F4F4",
          400: "#C4C4C4",
        },
        miruwhite: {
          400: "#FFFFFF",
        },
      },
      fontFamily :{
        jakartasans: "'Plus Jakarta Sans', serif",
      },
      spacing: {
        112: "28rem",
      },
      padding: {
        '36/100': '36.66666%',
        '32/100': '32.66666%',
        '30/100': '30%',
        '26/100': '26.66666%',
        '20/100': '20%',
        '10/100': '10%',
      },
    },
  },
  variants: {
    extend: {},
  },
  plugins: [],
}
