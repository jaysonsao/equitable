import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");

  return {
    plugins: [react()],
    define: {
      __GOOGLE_MAPS_API__: JSON.stringify(env.GOOGLE_MAPS_API || ""),
    },
    server: {
      proxy: {
        "/api": "http://localhost:3000",
        "/config.js": "http://localhost:3000",
      },
    },
  };
});
