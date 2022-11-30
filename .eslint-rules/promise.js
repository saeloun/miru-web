module.exports = {
  rules: {
    // not-auto-fixable: ensure people use async/await promising chaining rather than using "then-catch-finally" statements
    "promise/prefer-await-to-then": "error",
    // auto-fixable: avoid calling "new" on a Promise static method like reject, resolve etc
    "promise/no-new-statics": "error",
  },
};
