const postcssJitProps = require("postcss-jit-props");
const OpenProps = require("open-props");
const postcssImport = require("postcss-import");
const cssNano = require("cssnano");

module.exports = {
  plugins: [
    postcssImport(),
    postcssJitProps(OpenProps), // only vars used are in build output
    cssNano({
      preset: "default",
    }),
  ],
};
