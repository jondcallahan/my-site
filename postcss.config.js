const postcssImport = require("postcss-import");
const cssNano = require("cssnano");

module.exports = {
  plugins: [
    postcssImport(),
    cssNano({
      preset: "default",
    }),
  ],
};
