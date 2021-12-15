const { environment } = require('@rails/webpacker')
const ForkTSCheckerWebpackPlugin = require("fork-ts-checker-webpack-plugin");

environment.config.merge({
  plugins: [new ForkTSCheckerWebpackPlugin()],
})

const aliasConfig = require("./alias");
environment.config.merge(aliasConfig);

module.exports = environment
