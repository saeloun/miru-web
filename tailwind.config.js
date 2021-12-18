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
        miru: {
          200: "#F5F4F4",
          400: "#C4C4C4",
          1000: "#303A4B",
        },
      },
      fontFamily :{
        jakartasans: "'Plus Jakarta Sans', serif",
      },
      spacing: {
        112: "28rem",
      },
    },
  },
  variants: {
    extend: {},
  },
  plugins: [],
}
