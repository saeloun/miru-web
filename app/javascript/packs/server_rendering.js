// By default, this pack is loaded for server-side rendering.
// It must expose react_ujs as `ReactRailsUJS` and prepare a require context.

const componentRequireContext = require.context("src/components", true);
import * as ReactRailsUJS from "react_ujs";

import "../stylesheets/application.scss";
ReactRailsUJS.useContext(componentRequireContext);
