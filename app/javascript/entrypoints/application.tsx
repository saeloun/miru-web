import React from "react";
import * as ActiveStorage from "@rails/activestorage";
import Rails from "@rails/ujs";
import { createRoot } from "react-dom/client";
import { QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter } from "react-router-dom";
import { AuthProvider } from "../src/context/auth";
import { Toaster } from "sonner";
import queryClient from "../src/lib/queryClient";
import AppErrorBoundary from "../src/common/AppErrorBoundary";
// Geist font is loaded via CSS instead of npm package

import "../settings";
import "../stylesheets/application.scss";
import "../src/styles/geist.css";
import AppWithUserData from "../src/components/AppWithUserData";

// Initialize Rails
Rails.start();
ActiveStorage.start();

const THEME_STORAGE_KEY = "miru-theme";

const applyInitialTheme = () => {
  const savedTheme = window.localStorage.getItem(THEME_STORAGE_KEY);
  const preferredTheme =
    savedTheme === "light" || savedTheme === "dark"
      ? savedTheme
      : window.matchMedia("(prefers-color-scheme: dark)").matches
      ? "dark"
      : "light";

  document.documentElement.classList.toggle("dark", preferredTheme === "dark");
  const themeColor = preferredTheme === "dark" ? "#0a0a0a" : "#ffffff";
  const themeMeta = document.querySelector('meta[name="theme-color"]');
  if (themeMeta) themeMeta.setAttribute("content", themeColor);
};

const App = (props: any) => (
  <AppErrorBoundary>
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <AuthProvider>
          <Toaster
            richColors
            duration={5000}
            position="top-right"
            toastOptions={{
              classNames: {
                toast:
                  "rounded-xl border border-border bg-card text-card-foreground shadow-lg",
                title: "text-sm font-medium",
                description: "text-xs text-muted-foreground",
                success: "border-border bg-card text-card-foreground",
                error:
                  "border-destructive/40 bg-destructive/10 text-destructive",
                warning: "border-border bg-card text-card-foreground",
                info: "border-border bg-card text-card-foreground",
              },
            }}
          />
          <AppWithUserData {...props} />
        </AuthProvider>
      </BrowserRouter>
    </QueryClientProvider>
  </AppErrorBoundary>
);

// React mounting function
const mountReactApp = () => {
  applyInitialTheme();
  const legacyContainer = document.getElementById("react-root");
  if (legacyContainer && !(legacyContainer as any)._reactRoot) {
    const propsData = legacyContainer.getAttribute("data-props");
    const props = propsData ? JSON.parse(propsData) : {};
    const root = createRoot(legacyContainer);
    root.render(
      <div data-component="App" data-testid="app-loaded">
        <App {...props} />
        <div id="overlay" />
      </div>
    );
    (legacyContainer as any)._reactRoot = root;
  }
};

// Mount on DOM ready
document.addEventListener("DOMContentLoaded", mountReactApp);

// Support for Turbo/Stimulus if needed
document.addEventListener("turbo:load", mountReactApp);

// Export for global access
(window as any).MiruApp = { App, mountReactApp };
