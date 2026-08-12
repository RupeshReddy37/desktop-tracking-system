import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    strictPort: true,
    proxy: {
      '/api': {
        target: 'http://localhost:8081',
        changeOrigin: true
      }
    }
  },
  // OPTIMIZATION: Production build configuration
  build: {
    // Enable source maps only in development
    sourcemap: false,
    // Use terser for minification (better compression than esbuild)
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: true, // Remove console logs in production
      },
    },
    // Split vendor code for better caching
    rollupOptions: {
      output: {
        manualChunks: {
          // Split React into separate chunk
          'react-vendor': ['react', 'react-dom', 'react-router-dom'],
          // Split UI icons into separate chunk
          'ui-vendor': ['lucide-react'],
        },
      },
    },
    // Increase chunk size warning threshold (chunks will be smaller due to code splitting)
    chunkSizeWarningLimit: 500,
  },
  // Optimize dependencies
  optimizeDeps: {
    // Pre-bundle these dependencies
    include: ['react', 'react-dom', 'react-router-dom', 'lucide-react'],
  },
});
