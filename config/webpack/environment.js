const { environment } = require("@rails/webpacker");
const ForkTSCheckerWebpackPlugin = require("fork-ts-checker-webpack-plugin");

environment.config.merge({
  plugins: [new ForkTSCheckerWebpackPlugin()]
});

// const aliasConfig = require("./alias");
// environment.config.merge(aliasConfig);

const webpack = require('webpack')
environment.plugins.prepend('Provide',
  new webpack.ProvidePlugin({
    $: 'jquery/src/jquery',
    jQuery: 'jquery/src/jquery'
  })
);

module.exports = environment;
