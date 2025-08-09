import { defineConfig } from 'vite'
import RubyPlugin from 'vite-plugin-ruby'
import react from '@vitejs/plugin-react'
import tsconfigPaths from 'vite-tsconfig-paths'
import path from 'path'

export default defineConfig({
  plugins: [
    RubyPlugin(),
    react({
      include: ['**/*.jsx', '**/*.tsx', '**/*.js', '**/*.ts'],
    }),
    tsconfigPaths({
      ignoreConfigErrors: true,
    }),
  ],
  optimizeDeps: {
    esbuildOptions: {
      loader: {
        '.js': 'jsx',
        '.ts': 'tsx',
      },
    },
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './app/javascript'),
      'src': path.resolve(__dirname, './app/javascript/src'),
      'components': path.resolve(__dirname, './app/javascript/src/components'),
      'common': path.resolve(__dirname, './app/javascript/src/common'),
      'apis': path.resolve(__dirname, './app/javascript/src/apis'),
      'context': path.resolve(__dirname, './app/javascript/src/context'),
      'helpers': path.resolve(__dirname, './app/javascript/src/helpers'),
      'constants': path.resolve(__dirname, './app/javascript/src/constants'),
      'utils': path.resolve(__dirname, './app/javascript/src/utils'),
      'miruIcons': path.resolve(__dirname, './app/javascript/src/miruIcons'),
      'StyledComponents': path.resolve(__dirname, './app/javascript/src/StyledComponents'),
    },
  },
  server: {
    hmr: {
      host: 'localhost',
    },
  },
  build: {
    sourcemap: true,
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom', 'react-router-dom'],
          ui: ['@headlessui/react', '@heroicons/react', 'react-toastify'],
        },
      },
    },
  },
  css: {
    modules: {
      localsConvention: 'camelCase',
    },
  },
})