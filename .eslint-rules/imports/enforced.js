module.exports = {
  rules: {
    // not-auto-fixable: Prefer a default export if module exports a single name.
    "import/prefer-default-export": "off",
    // not-auto-fixable: Forbid a module from importing a module with a dependency path back to itself.
    "import/no-cycle": ["error", { maxDepth: 1, ignoreExternal: true }],
    // not-auto-fixable: Prevent unnecessary path segments in import and require statements.
    "import/no-useless-path-segments": ["error", { noUselessIndex: true }],
    // not-auto-fixable: Report any invalid exports, i.e. re-export of the same name.
    "import/export": "error",
    // not-auto-fixable: Forbid the use of mutable exports with var or let.
    "import/no-mutable-exports": "error",
    // not-auto-fixable: Ensure all imports appear before other statements.
    "import/first": "error",
    // not-auto-fixable: Ensure all exports appear after other statements.
    "import/exports-last": "error",
    // auto-fixable: Enforce a newline after import statements.
    "import/newline-after-import": ["error", { count: 1 }],
    // auto-fixable: Remove file extensions for import statements.
    "import/extensions": [
      "error",
      "never",
      {
        ignorePackages: true,
        pattern: { json: "always", mp3: "always" },
      },
    ],
  },
};
