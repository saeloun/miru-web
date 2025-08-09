import "@fontsource/plus-jakarta-sans";
import * as ActiveStorage from "@rails/activestorage";
import Rails from "@rails/ujs";
import "alpine-turbo-drive-adapter";
import "alpinejs";
import "jquery";
import * as ReactRailsUJS from "react_ujs";

// Settings
import "../settings";
import "../stylesheets/application.scss";

Rails.start();
ActiveStorage.start();

// Support component names relative to this directory:
const componentRequireContext = import.meta.glob(
  "../src/components/**/*.{jsx,tsx}",
  { eager: true }
);

// Convert glob imports to the format react_ujs expects
const components = {};
Object.entries(componentRequireContext).forEach(([path, module]) => {
  // Extract component name from path
  const matches = path.match(/\/([^/]+)\.(jsx|tsx)$/);
  if (matches) {
    const componentName = matches[1];
    components[componentName] = module.default || module;
  }
});

// Custom require context function for react_ujs
const requireContext = name => components[name];

// eslint-disable-next-line react-hooks/rules-of-hooks
ReactRailsUJS.useContext({ require: requireContext });

// Vite ⚡️ Rails loaded successfully!
