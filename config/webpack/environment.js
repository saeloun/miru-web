const { environment } = require('@rails/webpacker')

const aliasConfig = require("./alias");
environment.config.merge(aliasConfig);

module.exports = environment
