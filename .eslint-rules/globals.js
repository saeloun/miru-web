module.exports = {
  // Globals can be disabled with the string "off"
  // "writable" to allow the variable to be overwritten or "readonly" to disallow overwriting.
  globals: {
    Atomics: "readonly",
    SharedArrayBuffer: "readonly",
    // Makes logger function available everywhere. Else eslint will complaint of undef-var.
    logger: "readonly",
    module: "writable",
    // Makes props obtained from Rails backend available everywhere in this project.
    globalProps: "readonly",
  },
};
