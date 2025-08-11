// Entry point for the application pack
import "../application";
import "../channels";

// Import all components
const componentRequireContext = require.context("../src/components", true);
const ReactRailsUJS = require("react_ujs");
ReactRailsUJS.useContext(componentRequireContext);

console.log("Application pack loaded");
