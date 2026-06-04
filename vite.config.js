import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    // Prefer pdf-parse's browser build when importing "pdf-parse"
    conditions: ["browser", "import", "module", "default"],
  },
  server: {
    host: true, // ← allows access via IP address
    port: 5173, // optional: choose your port
  },
  base: '/AdviserSimplicity-Revamp/',
  // base: '/',
});
