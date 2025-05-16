import esbuild from "esbuild";

import fs from 'fs/promises';

const backgroundImageFixPlugin = {
    name: 'fix-background-image',
    setup(build) {
        build.onLoad({ filter: /\.js$/ }, async (args) => {
            try {
                let contents = await fs.readFile(args.path, 'utf8');
                contents = contents.replace(
                    /backgroundImage\s*=\s*`url\((\${inputImg})\)`/g,
                    'backgroundImage = `url("$1")`'
                );
                return { contents, loader: 'js' };
            } catch (err) {
                console.error(`Error processing ${args.path}:`, err);
                throw err;
            }
        });
    },
};

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
  // Fixes missing double quotes in svg backgroundImage assignment:
  // button.style.backgroundImage = url("${inputImg}"); //correct
  // instead of
  // button.style.backgroundImage = url(${inputImg}); // does not display buttons' svg
  plugins: [backgroundImageFixPlugin],
});
