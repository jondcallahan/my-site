const postcssConfig = require("./postcss.config.js");
const PostCSSPlugin = require("eleventy-plugin-postcss");

module.exports = function (eleventyConfig) {
  eleventyConfig.addWatchTarget("./style.css");
  eleventyConfig.addPassthroughCopy({
    public: ".",
    "node_modules/@fontsource/jetbrains-mono/files/jetbrains-mono-latin-600-normal.woff2":
      "fonts/jetbrains-mono-latin-600-normal.woff2",
    "node_modules/@fontsource/jetbrains-mono/files/jetbrains-mono-latin-600-normal.woff":
      "fonts/jetbrains-mono-latin-600-normal.woff",
    "node_modules/@fontsource/newsreader/files/newsreader-latin-400-normal.woff2":
      "fonts/newsreader-latin-400-normal.woff2",
    "node_modules/@fontsource/newsreader/files/newsreader-latin-400-normal.woff":
      "fonts/newsreader-latin-400-normal.woff",
  });
  eleventyConfig.addPlugin(PostCSSPlugin, postcssConfig);

  return {
    dir: {
      input: ".",
      output: "dist",
    },
    passthroughFileCopy: true,
  };
};
