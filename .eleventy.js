const postcssConfig = require("./postcss.config.js");
const PostCSSPlugin = require("eleventy-plugin-postcss");
const syntaxHighlight = require("@11ty/eleventy-plugin-syntaxhighlight");

module.exports = function (eleventyConfig) {
  eleventyConfig.addWatchTarget("./styles");
  eleventyConfig.addPassthroughCopy({
    public: ".",
    "node_modules/@fontsource/mona-sans/files": "styles/files",
    "node_modules/@fontsource/jetbrains-mono/files": "styles/files",
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
