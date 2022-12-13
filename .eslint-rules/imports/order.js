const { buildPathGroupsBasedOnWebpackAliases } = require(__dirname +
  "/../helpers");
const pathGroups = buildPathGroupsBasedOnWebpackAliases({});

const pathGroupForKeepingReactImportsAtTop = {
  pattern: "react+(-native|)",
  group: "external",
  position: "before",
};

/*
Example pathGroups structure. Adding this here
so that if anyone wants to add custom config,
they can make use of this:
[
  { pattern: 'apis/**', group: 'internal' },
  { pattern: 'common/**', group: 'internal' },
  { pattern: 'components/**', group: 'internal' },
  { pattern: 'constants/**', group: 'internal' },
  { pattern: 'contexts/**', group: 'internal' },
  { pattern: 'reducers/**', group: 'internal' },
  { pattern: 'Constants', group: 'internal' },
  {
    pattern: 'react+(-native|)',
    group: 'external',
    position: 'before'
  }
]
*/
pathGroups.push(pathGroupForKeepingReactImportsAtTop);

module.exports = {
  rules: {
    // auto-fixable: Enforce a convention in module import order
    "import/order": [
      "error",
      {
        "newlines-between": "always",
        alphabetize: { order: "asc", caseInsensitive: true },
        warnOnUnassignedImports: true,
        groups: [
          "builtin",
          "external",
          "internal",
          "index",
          "sibling",
          "parent",
          "object",
          "type",
        ],
        /*
         * Currently we check for existence of webpack alias
         * config and then iterate over the aliases and create
         * these pathGroups. Only caveat with this mechanism
         * is that in VSCode eslint plugin won't dynamically
         * read it. But eslint cli would!
         */
        pathGroups,
        // Ignore react imports so that they're always ordered to the top of the file.
        pathGroupsExcludedImportTypes: ["react", "react-native"],
      },
    ],
  },
};
