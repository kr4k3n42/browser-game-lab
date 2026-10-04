import { defineConfig } from "vite";

export default defineConfig({
  base: "./",
  build: {
    rollupOptions: {
      input: {
        hub: "index.html",
        firstShowcase: "games/first-showcase/index.html",
      },
    },
  },
});
