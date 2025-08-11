import React from "react";

import * as ActiveStorage from "@rails/activestorage";
import Rails from "@rails/ujs";
import { createRoot } from "react-dom/client";

import "../settings";
import "../stylesheets/application.scss";

// Simple React component for testing
const SimpleApp: React.FC<any> = props => (
  <div data-component="App" data-testid="app-loaded">
    <h1>Vite + React Integration Test</h1>
    <p>✅ React is working!</p>
    <p>✅ Props: {JSON.stringify(props)}</p>
    <div data-testid="login-ready">Ready for system tests</div>
  </div>
);

// Initialize Rails
Rails.start();
ActiveStorage.start();

// Mount React app
document.addEventListener("DOMContentLoaded", () => {
  const container = document.getElementById("react-root");
  if (container) {
    const root = createRoot(container);
    const initialProps = JSON.parse(container.dataset.props || "{}");
    root.render(<SimpleApp {...initialProps} />);
  }
});

// Simple Vite + Rails + React setup loaded successfully
