import { defineConfig } from "vitest/config";

export default defineConfig({
  resolve: {
    alias: {
      "react/jsx-dev-runtime": "react/jsx-dev-runtime.js",
      "react/jsx-runtime": "react/jsx-runtime.js",
    },
  },
  test: {
    environmentMatchGlobs: [["__tests__/**/*.dom.test.tsx", "jsdom"]],
    server: {
      deps: {
        inline: [/@griffel/, /@fluentui/],
      },
    },
  },
});
