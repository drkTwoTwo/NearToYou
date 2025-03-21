import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: true,
    port: 8080,
    allowedHosts: ['.ngrok-free.app'],
    cors: true,
    proxy: {
    '/api': {
        target: 'http://127.0.0.1:8000',  // Django backend
        changeOrigin: true,
        secure: false,  // Disable SSL verification (for local dev)
      },
    '/ws': {
      target: 'http://127.0.0.1:8000',
      changeOrigin: true,
      ws: true
    }
   },
  },
  plugins: [
    react(),
    mode === 'development' &&
    componentTagger(),
  ].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
}));
