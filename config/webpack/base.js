const webpack = require("webpack");
const aliasConfig = require("./alias");
const { baseConfig, merge } = require("shakapacker");
const ForkTSCheckerWebpackPlugin = require("fork-ts-checker-webpack-plugin");

let customConfig = {
  plugins: [
    new ForkTSCheckerWebpackPlugin(),
    new webpack.ProvidePlugin({
      $: "jquery/src/jquery",
      jQuery: "jquery/src/jquery",
    }),
    // Override DefinePlugin to prevent NODE_ENV conflict
    new webpack.DefinePlugin({
      'process.env.NODE_ENV': JSON.stringify(process.env.NODE_ENV || 'development')
    }),
  ],
  // Disable performance warnings in development
  performance: {
    hints: false,
    maxEntrypointSize: 512000,
    maxAssetSize: 512000,
  },
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

module.exports = merge(baseConfig, customConfig);
