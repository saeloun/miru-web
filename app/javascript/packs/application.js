import "@fontsource/plus-jakarta-sans";
import * as ActiveStorage from "@rails/activestorage";
import Rails from "@rails/ujs";
import "alpine-turbo-drive-adapter";
import * as ReactRailsUJS from "react_ujs";

require("alpinejs");
require("jquery");

import "../stylesheets/application.scss";

global.toastr = require("toastr");
global.toastr.options = {
  closeButton: true,
  closeHtml: "<button></button>",
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
  hideMethod: "fadeOut",
};
Rails.start();
ActiveStorage.start();

// Support component names relative to this directory:
const componentRequireContext = require.context("src/components", true);
ReactRailsUJS.useContext(componentRequireContext);

require("packs/settings");
