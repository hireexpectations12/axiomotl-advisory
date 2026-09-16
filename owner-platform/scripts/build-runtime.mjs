import { build } from "esbuild";
await build({
  entryPoints: ["src/runtime/forms.tsx"],
  bundle: true,
  minify: true,
  format: "iife",
  platform: "browser",
  target: ["es2020"],
  outfile: "public/runtime/forms.js",
  define: { "process.env.NODE_ENV": '"production"' },
  jsx: "automatic",
});
