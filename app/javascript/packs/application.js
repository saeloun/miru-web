import "@fontsource/plus-jakarta-sans";
import * as ActiveStorage from "@rails/activestorage";
import Rails from "@rails/ujs";
import "alpine-turbo-drive-adapter";
import * as ReactRailsUJS from "react_ujs";

require("alpinejs");
require("jquery");

import "../stylesheets/application.scss";

Rails.start();
ActiveStorage.start();

// Support component names relative to this directory:
const componentRequireContext = require.context("src/components", true);
ReactRailsUJS.useContext(componentRequireContext);

require("packs/settings");
