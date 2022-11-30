module.exports = {
  rules: {
    // not-auto-fixable: Prevent missing props validation in a React component definition.
    "react/prop-types": "off",
    // not-auto-fixable: Detect unescaped HTML entities, which might represent malformed tags.
    "react/no-unescaped-entities": "off",
    // not-auto-fixable: Prevent missing displayName in a React component definition. Useful when using React extensions in browser and checking for component name.
    "react/display-name": "error",
    // not-auto-fixable: Reports when this.state is accessed within setState.
    "react/no-access-state-in-setstate": "error",
    // not-auto-fixable: Prevent usage of dangerous JSX props. Currently jam3 plugin will take care of handling this.
    "react/no-danger": "off",
    // not-auto-fixable: Report when a DOM element is using both children and dangerouslySetInnerHTML.
    "react/no-danger-with-children": "warn",
    // not-auto-fixable: Prevent definitions of unused prop types.
    "react/no-unused-prop-types": "error",
    // not-auto-fixable: Report missing key props in iterators/collection literals. Important rule!
    "react/jsx-key": "error",
    // not-auto-fixable: Enforce no duplicate props.
    "react/jsx-no-duplicate-props": "error",
    // not-auto-fixable: Disallow undeclared variables in JSX.
    "react/jsx-no-undef": "error",
    // not-auto-fixable: Enforce PascalCase for user-defined JSX components.
    "react/jsx-pascal-case": ["error", { allowNamespace: true }],
    // not-auto-fixable: Prevent React to be incorrectly marked as unused.
    "react/jsx-uses-react": "error",
    // not-auto-fixable: Prevent variables used in JSX to be marked as unused.
    "react/jsx-uses-vars": "error",
    // not-auto-fixable: Ensures https://reactjs.org/docs/hooks-rules.html.
    "react-hooks/rules-of-hooks": "error",
    // not-auto-fixable: Ensures https://reactjs.org/docs/hooks-rules.html - Checks effect dependencies.
    "react-hooks/exhaustive-deps": "warn",
    // auto-fixable: A fragment is redundant if it contains only one child, or if it is the child of a html element, and is not a keyed fragment.
    "react/jsx-no-useless-fragment": ["error", { allowExpressions: true }],
    // auto-fixable: Prefer arrow function expressions for component declaration.
    "react/function-component-definition": [
      "error",
      {
        namedComponents: "arrow-function",
        unnamedComponents: "arrow-function",
      },
    ],
    // auto-fixable: Components without children can be self-closed to avoid unnecessary extra closing tag.
    "react/self-closing-comp": [
      "error",
      {
        component: true,
        html: true,
      },
    ],
    // auto-fixable: Wrapping multiline JSX in parentheses can improve readability and/or convenience.
    "react/jsx-wrap-multilines": [
      "error",
      {
        declaration: "parens-new-line",
        assignment: "parens-new-line",
        return: "parens-new-line",
        arrow: "parens-new-line",
        condition: "parens-new-line",
        logical: "parens-new-line",
        prop: "ignore",
      },
    ],
    // not-auto-fixable: Make sure files containing JSX is having .jsx extension.
    "react/jsx-filename-extension": ["error", { allow: "as-needed" }],
    // auto-fixable: Omit mentioning the "true" value if it can be implicitly understood in props.
    "react/jsx-boolean-value": "error",
    // auto-fixable: Partially fixable. Make sure the state and setter have symmertic naming.
    "react/hook-use-state": "error",
    // auto-fixable: Shorthand notations should always be at the top and also enforce props alphabetical sorting.
    "react/jsx-sort-props": [
      "error",
      {
        callbacksLast: true,
        shorthandFirst: true,
        multiline: "last",
        reservedFirst: false,
        locale: "auto",
      },
    ],
    // auto-fixable: Disallow unnecessary curly braces in JSX props and/or children.
    "react/jsx-curly-brace-presence": [
      "error",
      {
        props: "never",
        children: "never",
        // JSX prop values that are JSX elements should be enclosed in braces.
        propElementValues: "always",
      },
    ],
  },
};
