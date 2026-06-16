import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import dotenv from "dotenv";

dotenv.config();

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
    proxy: {
      "/api": {
        // target: process.env.VITE_API_BASE_URL,
        target: "https://as.denarowealth.com.au",
        changeOrigin: true,
        secure: false,
      },
    },
  },
  base: "/AdviserSimplicity-Revamp/",
  // base: '/',
});
