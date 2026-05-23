import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react-swc";
import path from "path";

export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: "jsdom",
    setupFiles: ["./src/test/setup.ts"],
    include: ["./src/test/**/*.{test,spec}.{ts,tsx}"],
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
      "@digihire/ui": path.resolve(__dirname, "../../packages/ui/src"),
      "@digihire/supabase": path.resolve(__dirname, "../../packages/supabase/src"),
      "@digihire/hooks": path.resolve(__dirname, "../../packages/hooks/src"),
      "@digihire/shared": path.resolve(__dirname, "../../packages/shared/src"),
    },
  },
});
