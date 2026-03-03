import { defineConfig, Plugin } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";

function glsl(): Plugin {
  return {
    name: "glsl",
    transform(code, id) {
      if (/\.(frag|vert|glsl)$/.test(id)) {
        return {
          code: `export default ${JSON.stringify(code)};`,
          map: null,
        };
      }
    },
  };
}

export default defineConfig({
  plugins: [
    react({ jsxRuntime: "classic" }),
    glsl(),
  ],
  resolve: {
    alias: {
      "three-examples": path.resolve(__dirname, "node_modules/three/examples/js/"),
    },
  },
  css: {
    preprocessorOptions: {
      scss: {
        silenceDeprecations: ["import", "global-builtin"],
      },
    },
  },
  server: {
    host: "0.0.0.0",
    open: true,
  },
});
