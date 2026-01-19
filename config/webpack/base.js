const webpack = require("webpack");
const aliasConfig = require("./alias");
const { generateWebpackConfig, merge } = require("shakapacker");
const ForkTSCheckerWebpackPlugin = require("fork-ts-checker-webpack-plugin");

// Generate the base webpack config from shakapacker
const webpackConfig = generateWebpackConfig();

let customConfig = {
  plugins: [
    new ForkTSCheckerWebpackPlugin(),
    new webpack.ProvidePlugin({
      $: "jquery/src/jquery",
      jQuery: "jquery/src/jquery",
    }),
  ],
};

const resolveOptions = {
  resolve: {
    extensions: [
      ".css",
      ".ts",
      ".tsx",
      ".js",
      ".jsx",
      ".png",
      ".svg",
      ".gif",
      ".jpeg",
      ".jpg",
      ".woff",
      ".woff2",
      ".ico",
    ],
  },
};

customConfig = merge({}, customConfig, resolveOptions, aliasConfig);

module.exports = merge(webpackConfig, customConfig);
