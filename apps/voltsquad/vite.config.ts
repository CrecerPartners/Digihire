import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";

export default defineConfig({
  plugins: [react()],
  server: {
    host: "::",
    port: 8081,
    hmr: { overlay: false },
  },
  resolve: {
    alias: {
      "@":               path.resolve(__dirname, "./src"),
      "@digihire/shared": path.resolve(__dirname, "../../packages/shared/src"),
    },
  },
  build: {
    rollupOptions: {
      input: {
        main: path.resolve(__dirname, 'index.html'),
        app: path.resolve(__dirname, 'app.html')
      }
    }
  }
});
