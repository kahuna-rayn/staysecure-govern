import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";

// https://vitejs.dev/config/
export default defineConfig({
  server: {
    host: "::",
    port: 8080,
    hmr: {
      overlay: false, // Disable error overlay
    },
  },
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  logLevel: 'warn', // Reduce console output - only show warnings and errors
  customLogger: {
    info: () => {}, // Suppress info messages (including HMR updates)
    warn: console.warn,
    error: console.error,
  },
});
