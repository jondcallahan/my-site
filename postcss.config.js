const postcssJitProps = require("postcss-jit-props");
const OpenProps = require("open-props");
const postcssImport = require("postcss-import");

module.exports = {
  // only vars used are in build output
  plugins: [postcssImport(), postcssJitProps(OpenProps)],
};
