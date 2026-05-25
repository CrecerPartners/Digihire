import { defineConfig } from "vite";
import path from "path";

export default defineConfig({
  server: {
    host: "::",
    port: 8080,
  },
  build: {
    rollupOptions: {
      input: {
        main:      path.resolve(__dirname, "index.html"),
        about:     path.resolve(__dirname, "about.html"),
        blog:      path.resolve(__dirname, "blog.html"),
        contact:   path.resolve(__dirname, "contact.html"),
        events:    path.resolve(__dirname, "events.html"),
        voltsquad: path.resolve(__dirname, "voltsquad.html"),
        salesActivations: path.resolve(__dirname, "sales-activations.html"),
        "blog-post": path.resolve(__dirname, "blog-post.html"),
        "blog-ai-resume": path.resolve(__dirname, "blog-ai-resume.html"),
        "blog-enterprise-sales": path.resolve(__dirname, "blog-enterprise-sales.html"),
        "blog-gig-economy": path.resolve(__dirname, "blog-gig-economy.html"),
        "blog-mall-activations": path.resolve(__dirname, "blog-mall-activations.html"),
        "blog-performance-campaign": path.resolve(__dirname, "blog-performance-campaign.html"),
        "blog-remote-hiring": path.resolve(__dirname, "blog-remote-hiring.html"),
        "blog-tech-sales": path.resolve(__dirname, "blog-tech-sales.html"),
      },
    },
  },
});
