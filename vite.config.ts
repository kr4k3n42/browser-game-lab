import { defineConfig } from "vite";

export default defineConfig({
  base: "./",
  build: {
    rollupOptions: {
      input: {
        hub: "index.html",
        roadster: "games/roadster/index.html",
        roadsterDossier: "games/roadster/dossier.html",
        afterglow: "games/afterglow/index.html",
        firstShowcase: "games/first-showcase/index.html",
        tipper: "games/tipper/index.html",
        stillFlight: "games/still-flight/index.html",
      },
    },
  },
});
