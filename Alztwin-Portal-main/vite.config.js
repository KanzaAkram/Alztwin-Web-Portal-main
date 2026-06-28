import path from "path";
import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, ".", "");
  return {
    server: {
      port: 3000,
      host: "0.0.0.0",
      proxy: {
        "/api/stage": {
          target: "https://alztwin-prediction-api.azurewebsites.net",
          changeOrigin: true,
          secure: true,
          rewrite: (p) => p.replace(/^\/api\/stage/, "/predict"),
        },
        "/api/progression": {
          target: "https://alztwin-trajectory-yusra-sea.azurewebsites.net",
          changeOrigin: true,
          secure: true,
          rewrite: (p) => p.replace(/^\/api\/progression/, "/predict"),
        },
        "/api/cognitive": {
          target: "https://alztwin-voice-api.azurewebsites.net",
          changeOrigin: true,
          secure: true,
          rewrite: (p) => p.replace(/^\/api\/cognitive/, "/predict"),
        },
        "/api/brain": {
          target: "https://alztwin-brain-api.azurewebsites.net",
          changeOrigin: true,
          secure: true,
          rewrite: (p) => p.replace(/^\/api\/brain/, ""),
        },
        "/api/rag": {
          target: "https://func-alztwin-proto.azurewebsites.net",
          changeOrigin: true,
          secure: true,
          rewrite: (p) => p.replace(/^\/api\/rag/, "/api"),
        },
      },
    },
    plugins: [react()],
    define: {
      "process.env.API_KEY": JSON.stringify(env.GEMINI_API_KEY),
      "process.env.GEMINI_API_KEY": JSON.stringify(env.GEMINI_API_KEY),
    },
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "."),
      },
    },
  };
});
