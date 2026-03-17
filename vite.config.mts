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
      '~': path.resolve(__dirname, './app/javascript/src'),
      '@/components': path.resolve(__dirname, './app/javascript/src/components'),
      '@/lib': path.resolve(__dirname, './app/javascript/src/lib'),
      '@/ui': path.resolve(__dirname, './app/javascript/src/components/ui'),
      'components': path.resolve(__dirname, './app/javascript/src/components'),
      'constants': path.resolve(__dirname, './app/javascript/src/constants'),
      'context': path.resolve(__dirname, './app/javascript/src/context'),
      'contexts': path.resolve(__dirname, './app/javascript/src/contexts'),
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
        api: 'modern-compiler'
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
        manualChunks(id) {
          if (!id.includes('node_modules')) return undefined

          if (
            id.includes('/react/') ||
            id.includes('/react-dom/') ||
            id.includes('/scheduler/')
          ) {
            return 'react'
          }

          if (
            id.includes('/react-router/') ||
            id.includes('/react-router-dom/')
          ) {
            return 'router'
          }

          if (
            id.includes('/@tanstack/react-query/') ||
            id.includes('/@tanstack/query-core/')
          ) {
            return 'react-query'
          }

          if (
            id.includes('/recharts/') ||
            id.includes('/victory-vendor/')
          ) {
            return 'charts'
          }

          if (
            id.includes('/framer-motion/') ||
            id.includes('/motion-dom/') ||
            id.includes('/motion-utils/')
          ) {
            return 'motion'
          }

          if (
            id.includes('/date-fns/') ||
            id.includes('/dayjs/') ||
            id.includes('/react-day-picker/')
          ) {
            return 'dates'
          }

          if (
            id.includes('/@radix-ui/') ||
            id.includes('/cmdk/') ||
            id.includes('/embla-carousel-react/')
          ) {
            return 'ui-vendor'
          }

          return 'vendor'
        }
      }
    }
  }
})
