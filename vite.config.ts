import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "src")
    }
  },
  build: {
    rollupOptions: {
      output: {
        // Split heavy third-party code into cacheable vendor chunks so the
        // main app bundle stays small and individual chunks can be cached
        // independently across deploys.
        manualChunks: {
          "firebase-app": ["firebase/app", "firebase/auth"],
          "firebase-firestore": ["firebase/firestore"],
          "firebase-messaging": ["firebase/messaging"],
          react: ["react", "react-dom", "react-router-dom"],
          dnd: ["@dnd-kit/core", "@dnd-kit/sortable", "@dnd-kit/utilities"]
        }
      }
    }
  }
});
