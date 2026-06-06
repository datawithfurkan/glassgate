import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

const API_TARGET = "http://127.0.0.1:3001";

export default defineConfig({
  plugins: [react()],
  server: {
    host: "127.0.0.1",
    proxy: {
      "/api": API_TARGET,
      "/generated": API_TARGET,
    },
  },
  preview: {
    host: "127.0.0.1",
    proxy: {
      "/api": API_TARGET,
      "/generated": API_TARGET,
    },
  },
});
