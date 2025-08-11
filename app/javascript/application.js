import "@fontsource/plus-jakarta-sans";
import * as ActiveStorage from "@rails/activestorage";
import Rails from "@rails/ujs";
import "alpine-turbo-drive-adapter";
import "alpinejs";
import "jquery";
import * as ReactRailsUJS from "react_ujs";

import "./settings";
import "./stylesheets/application.scss";

Rails.start();
ActiveStorage.start();

// Support component names relative to this directory:
// Note: require.context is webpack-specific and needs Vite alternative
// Using dynamic imports for Vite compatibility
const componentModules = import.meta.glob(
  "./src/components/**/*.{js,jsx,ts,tsx}",
  { eager: true }
);

const componentRequireContext = path => {
  const fullPath = `./src/components${
    path.startsWith("./") ? path.slice(1) : `/${path}`
  }`;

  return (
    componentModules[fullPath] ||
    componentModules[`${fullPath}.jsx`] ||
    componentModules[`${fullPath}.tsx`]
  );
};

componentRequireContext.keys = () =>
  Object.keys(componentModules).map(path =>
    path.replace("./src/components", ".")
  );
// eslint-disable-next-line react-hooks/rules-of-hooks
ReactRailsUJS.useContext(componentRequireContext);
