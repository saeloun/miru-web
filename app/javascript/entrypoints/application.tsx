import React from "react";

import * as ActiveStorage from "@rails/activestorage";
import Rails from "@rails/ujs";
import { createRoot } from "react-dom/client";

import "../settings";
import App from "../src/components/App";
import "../stylesheets/application.scss";

// Define prop types
interface AppProps {
  user?: any;
  companyRole?: string;
  company?: any;
  confirmedUser?: boolean;
  isDesktop?: boolean;
  isAdminUser?: boolean;
  googleOauthSuccess?: boolean;
  avatarUrl?: string;
  calendarEnabled?: boolean;
  calendarConnected?: boolean;
}

// Initialize Rails
Rails.start();
ActiveStorage.start();

// React mounting function
const mountReactApp = () => {
  const containers = document.querySelectorAll("[data-react-component]");

  containers.forEach(container => {
    const componentName = container.getAttribute("data-react-component");
    const propsData = container.getAttribute("data-react-props");

    if (componentName === "Main" || componentName === "App") {
      const props: AppProps = propsData ? JSON.parse(propsData) : {};

      // Check if root already exists (prevents duplicate mounting)
      if (!(container as any)._reactRoot) {
        const root = createRoot(container);
        root.render(<App {...props} />);
        (container as any)._reactRoot = root;
      }
    }
  });

  // Fallback for legacy react-root containers
  const legacyContainer = document.getElementById("react-root");
  if (legacyContainer && !(legacyContainer as any)._reactRoot) {
    const propsData = legacyContainer.getAttribute("data-props");
    const props: AppProps = propsData ? JSON.parse(propsData) : {};
    const root = createRoot(legacyContainer);
    root.render(<App {...props} />);
    (legacyContainer as any)._reactRoot = root;
  }
};

// Mount on DOM ready
document.addEventListener("DOMContentLoaded", mountReactApp);

// Support for Turbo/Stimulus if needed
document.addEventListener("turbo:load", mountReactApp);

// Export for global access
(window as any).MiruApp = { App, mountReactApp };

// Vite + Rails + React integration loaded successfully
