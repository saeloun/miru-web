import "@fontsource/plus-jakarta-sans";
import * as ActiveStorage from "@rails/activestorage";
import Rails from "@rails/ujs";
import "alpine-turbo-drive-adapter";
import * as ReactRailsUJS from "react_ujs";

import "./stylesheets/application.scss";

require("alpinejs");
require("jquery");

require("settings");

Rails.start();
ActiveStorage.start();

// Support component names relative to this directory:
const componentRequireContext = require.context("src/components", true);
// eslint-disable-next-line react-hooks/rules-of-hooks
ReactRailsUJS.useContext(componentRequireContext);
