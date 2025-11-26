import { defineConfig } from "vitest/config";
import { resolve } from "path";

export default defineConfig({
  test: {
    environment: "jsdom",
    setupFiles: ["./vitest.setup.ts"],
    globals: true,
  },
  resolve: {
    alias: {
      "@common": resolve(__dirname, "src/renderer/common"),
      "@renderer": resolve(__dirname, "src/renderer"),
    },
  },
});
