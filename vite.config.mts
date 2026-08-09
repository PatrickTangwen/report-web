import { resolve } from "node:path";
import { defineConfig } from "vite";

const rootDir = import.meta.dirname;

export default defineConfig(({ mode }) => {
  if (mode === "assistant") {
    return {
      build: {
        outDir: "frontend/dist",
        emptyOutDir: true,
        lib: {
          entry: resolve(rootDir, "frontend/src/assistant-api.ts"),
          name: "ALIGATEHR_ASSISTANT_API",
          formats: ["umd"],
          fileName: () => "assistant-api.js",
        },
      },
    };
  }

  if (mode === "visualization") {
    return {
      build: {
        outDir: "frontend/dist",
        emptyOutDir: false,
        lib: {
          entry: resolve(rootDir, "frontend/src/regl-scatterplot.ts"),
          formats: ["es"],
          fileName: () => "regl-scatterplot.js",
        },
      },
    };
  }

  throw new Error(`Unsupported frontend build mode: ${mode}`);
});
