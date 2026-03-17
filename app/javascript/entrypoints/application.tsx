import React from "react";
import * as ActiveStorage from "@rails/activestorage";
import Rails from "@rails/ujs";
import { createRoot } from "react-dom/client";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter } from "react-router-dom";
import { AuthProvider } from "../src/context/auth";
import { Toaster } from "sonner";
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
};

// Create a client outside the component to avoid recreation
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes
      retry: (failureCount, error: any) => {
        // Don't retry on 4xx errors except 408 (timeout)
        if (
          error?.status >= 400 &&
          error?.status < 500 &&
          error?.status !== 408
        ) {
          return false;
        }

        return failureCount < 3;
      },
      refetchOnWindowFocus: false,
    },
    mutations: {
      retry: 1,
    },
  },
});

const App = (props: any) => (
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
              success:
                "border-emerald-500/20 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300",
              error: "border-destructive/20 bg-destructive/10 text-destructive",
              warning:
                "border-amber-500/20 bg-amber-500/10 text-amber-700 dark:text-amber-300",
              info: "border-primary/20 bg-primary/10 text-primary dark:text-primary",
            },
          }}
        />
        <AppWithUserData {...props} />
      </AuthProvider>
    </BrowserRouter>
  </QueryClientProvider>
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
