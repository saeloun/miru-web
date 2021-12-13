import "../stylesheets/application.scss";

require("@rails/ujs").start();
require("@rails/activestorage").start();

var componentRequireContext = require.context("src", true);
var ReactRailsUJS = require("react_ujs");

ReactRailsUJS.useContext(componentRequireContext);