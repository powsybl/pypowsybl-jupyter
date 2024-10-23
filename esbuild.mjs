import esbuild from "esbuild";

esbuild.build({
  entryPoints: ["js/*.ts", "js/*.jsx"],
  bundle: true,
  minify: true,
  target: ["es2020"],
  outdir: "src/pypowsybl_jupyter/static/",
  format: "esm",
  // Ref. https://github.com/powsybl/pypowsybl-jupyter/issues/30, https://github.com/manzt/anywidget/issues/506 and https://github.com/manzt/anywidget/issues/369#issuecomment-1792376003
  define: {
    "define.amd": "false",
  },
});
