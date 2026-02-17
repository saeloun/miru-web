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
import "../src/styles/geist-font.css";
import "../src/styles/geist.css";
import AppWithUserData from "../src/components/AppWithUserData";

// Initialize Rails
Rails.start();
ActiveStorage.start();

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
                "bg-white text-gray-900 border border-gray-200 rounded-md shadow-sm",
              title: "text-sm font-medium",
              description: "text-xs text-gray-600",
              success: "bg-green-50 border-green-200 text-green-800",
              error: "bg-red-50 border-red-200 text-red-800",
              warning: "bg-yellow-50 border-yellow-200 text-yellow-800",
              info: "bg-blue-50 border-blue-200 text-blue-800",
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
