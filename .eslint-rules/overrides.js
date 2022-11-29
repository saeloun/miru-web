module.exports = {
  // Currently we are using this section for excluding certain files from certain rules.
  overrides: [
    {
      files: [
        ".eslintrc.js",
        ".prettierrc.js",
        "app/assets/**/*",
        "app/javascript/packs/**/*",
        "*.json",
      ],
      rules: {
        "import/order": "off",
        "react-hooks/rules-of-hooks": "off",
      },
    },
    {
      files: ["app/javascript/packs/**/*.{js,jsx}"],
      rules: {
        "no-redeclare": "off",
      },
    },
  ],
};
