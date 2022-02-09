// By default, this pack is loaded for server-side rendering.
// It must expose react_ujs as `ReactRailsUJS` and prepare a require context.
import "../stylesheets/application.scss";

const componentRequireContext = require.context("src/components", true);
import * as ReactRailsUJS from "react_ujs";
ReactRailsUJS.useContext(componentRequireContext);
