import { defineConfig } from "vite";
import UnoCSS from "unocss/vite";
import { svelte } from "@sveltejs/vite-plugin-svelte";
import { viteSingleFile } from "vite-plugin-singlefile";

export default defineConfig(({ command }) => ({
  plugins: [
    UnoCSS(),
    svelte(),
    command === "build" &&
      viteSingleFile({
        removeViteModuleLoader: true,
      }),
  ],
  build: {
    minify: false,
  },
}));
