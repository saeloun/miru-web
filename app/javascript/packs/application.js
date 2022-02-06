import "../stylesheets/application.scss";

import * as ActiveStorage from "@rails/activestorage";
import Rails from "@rails/ujs";
import * as ReactRailsUJS from "react_ujs";

import "alpine-turbo-drive-adapter";
require("alpinejs");
require("jquery");

import "@fontsource/plus-jakarta-sans";

global.toastr = require("toastr");
Rails.start();
ActiveStorage.start();

// Support component names relative to this directory:
const componentRequireContext = require.context("src/components", true);
ReactRailsUJS.useContext(componentRequireContext);

require("packs/team_search");
