// Entry point for the application pack
import "../application";
import "../channels";
import ReactRailsUJS from "react_ujs";

// Import all components
// Note: require.context is webpack-specific, using Vite's import.meta.glob
const componentModules = import.meta.glob('../src/components/**/*.{js,jsx,ts,tsx}', { eager: true });
const componentRequireContext = (path) => {
  const fullPath = `../src/components${path.startsWith('./') ? path.slice(1) : '/' + path}`;
  return componentModules[fullPath] || componentModules[fullPath + '.jsx'] || componentModules[fullPath + '.tsx'];
};
componentRequireContext.keys = () => Object.keys(componentModules).map(path => path.replace('../src/components', '.'));
ReactRailsUJS.useContext(componentRequireContext);

console.log("Application pack loaded");
