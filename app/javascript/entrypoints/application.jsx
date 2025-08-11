import React from 'react';
import { createRoot } from 'react-dom/client';
import '@fontsource/plus-jakarta-sans';
import Rails from '@rails/ujs';
import * as ActiveStorage from '@rails/activestorage';

// Import styles
import '../stylesheets/application.scss';

// Import App component (which already has all providers)
import App from '../src/components/App';

// Start Rails UJS and ActiveStorage
Rails.start();
ActiveStorage.start();

// Mount function
function mountReactApp() {
  const rootElement = document.getElementById('react-root');
  
  if (!rootElement) {
    // React root element not found - this is expected during testing
    return;
  }

  // Get props from data attribute
  const props = JSON.parse(rootElement.dataset.props || '{}');
  
  // Create root and render
  const root = createRoot(rootElement);
  root.render(
    <React.StrictMode>
      <App {...props} />
    </React.StrictMode>
  );
}

// Mount when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', mountReactApp);
} else {
  mountReactApp();
}