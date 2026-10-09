import { build } from "esbuild";
await build({
  entryPoints: ["src/runtime/enhancements.tsx"],
  bundle: true,
  minify: true,
  format: "iife",
  platform: "browser",
  target: ["es2020"],
  outfile: "public/runtime/enhancements.js",
  define: { "process.env.NODE_ENV": '"production"' },
  jsx: "automatic",
});
await build({
  entryPoints: ["src/runtime/parallax.ts"],
  bundle: true,
  minify: true,
  format: "iife",
  platform: "browser",
  target: ["es2020"],
  outfile: "public/runtime/parallax.js",
});
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
await build({
  entryPoints: ["src/runtime/approach.ts"],
  bundle: true,
  minify: true,
  format: "iife",
  platform: "browser",
  target: ["es2020"],
  outfile: "public/runtime/approach.js",
});
