import "../stylesheets/application.scss";

import("@rails/ujs").start();
import("@rails/activestorage").start();

// Support component names relative to this directory:
const componentRequireContext = require.context("components", true);
import * as ReactRailsUJS from "react_ujs";
ReactRailsUJS.useContext(componentRequireContext);
