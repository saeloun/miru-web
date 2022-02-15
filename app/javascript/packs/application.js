import "../stylesheets/application.scss";

import * as ActiveStorage from "@rails/activestorage";
import Rails from "@rails/ujs";
import * as ReactRailsUJS from "react_ujs";

import "alpine-turbo-drive-adapter";
require("alpinejs");
require("jquery");

import "@fontsource/plus-jakarta-sans";

global.toastr = require("toastr");
global.toastr.options = {
  closeButton: true,
  debug: false,
  newestOnTop: false,
  progressBar: false,
  positionClass: "toast-bottom-center",
  preventDuplicates: false,
  onclick: null,
  showDuration: "300",
  hideDuration: "1000",
  timeOut: "5000",
  extendedTimeOut: "1000",
  showEasing: "swing",
  hideEasing: "linear",
  showMethod: "fadeIn",
  hideMethod: "fadeOut"
};
Rails.start();
ActiveStorage.start();

// Support component names relative to this directory:
const componentRequireContext = require.context("src/components", true);
ReactRailsUJS.useContext(componentRequireContext);

require("packs/companies");
