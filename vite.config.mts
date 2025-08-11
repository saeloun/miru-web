import { defineConfig } from 'vite'
import RubyPlugin from 'vite-plugin-ruby'
import path from 'path'

export default defineConfig({
  plugins: [
    RubyPlugin()
  ],
  define: {
    global: 'globalThis',
  },
  esbuild: {
    loader: 'tsx',
    jsxFactory: 'React.createElement',
    jsxFragment: 'React.Fragment'
  },
  server: {
    host: 'localhost',
    port: 3036,
    strictPort: false,
    watch: {
      ignored: ['**/tmp/**', '**/log/**', '**/node_modules/**']
    },
    hmr: {
      host: 'localhost',
      port: 3036
    }
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './app/javascript'),
      'components': path.resolve(__dirname, './app/javascript/src/components'),
      'constants': path.resolve(__dirname, './app/javascript/src/constants'),
      'context': path.resolve(__dirname, './app/javascript/src/context'),
      'apis': path.resolve(__dirname, './app/javascript/src/apis'),
      'helpers': path.resolve(__dirname, './app/javascript/src/helpers'),
      'utils': path.resolve(__dirname, './app/javascript/src/utils'),
      'common': path.resolve(__dirname, './app/javascript/src/common'),
      'StyledComponents': path.resolve(__dirname, './app/javascript/src/StyledComponents'),
      'mapper': path.resolve(__dirname, './app/javascript/src/mapper'),
      'miruIcons': path.resolve(__dirname, './app/javascript/src/miruIcons'),
      'reducers': path.resolve(__dirname, './app/javascript/src/reducers')
    },
    extensions: ['.js', '.jsx', '.ts', '.tsx', '.json']
  },
  css: {
    preprocessorOptions: {
      scss: {
        api: 'legacy'
      }
    }
  },
  optimizeDeps: {
    include: ['react', 'react-dom', 'react/jsx-runtime'],
    esbuildOptions: {
      loader: {
        '.js': 'jsx',
        '.jsx': 'jsx',
        '.ts': 'tsx',
        '.tsx': 'tsx'
      }
    }
  },
  build: {
    sourcemap: true,
    rollupOptions: {
      output: {
        manualChunks: {
          react: ['react', 'react-dom']
        }
      }
    }
  }
})