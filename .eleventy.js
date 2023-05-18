const postcssConfig = require("./postcss.config.js");
const PostCSSPlugin = require("eleventy-plugin-postcss");
const syntaxHighlight = require("@11ty/eleventy-plugin-syntaxhighlight");

module.exports = function (eleventyConfig) {
  eleventyConfig.addWatchTarget("./styles");
  eleventyConfig.addPassthroughCopy({
    public: ".",
    "node_modules/@fontsource/jetbrains-mono/files/jetbrains-mono-latin-600-normal.woff2":
      "fonts/jetbrains-mono-latin-600-normal.woff2",
    "node_modules/@fontsource/jetbrains-mono/files/jetbrains-mono-latin-600-normal.woff":
      "fonts/jetbrains-mono-latin-600-normal.woff",
    "node_modules/@fontsource/jetbrains-mono/files/jetbrains-mono-latin-400-normal.woff2":
      "fonts/jetbrains-mono-latin-400-normal.woff2",
    "node_modules/@fontsource/jetbrains-mono/files/jetbrains-mono-latin-400-normal.woff":
      "fonts/jetbrains-mono-latin-400-normal.woff",
  });
  eleventyConfig.addPlugin(PostCSSPlugin, postcssConfig);
  eleventyConfig.addPlugin(syntaxHighlight);

  return {
    dir: {
      input: ".",
      output: "dist",
    },
    passthroughFileCopy: true,
  };
};
