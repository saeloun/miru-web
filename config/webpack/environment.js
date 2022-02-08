const { environment } = require("@rails/webpacker");
const ForkTSCheckerWebpackPlugin = require("fork-ts-checker-webpack-plugin");

environment.config.merge({
  plugins: [new ForkTSCheckerWebpackPlugin()]
});

module.exports = environment;
