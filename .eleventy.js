module.exports = function (eleventyConfig) {
  eleventyConfig.addWatchTarget("./styles");
  eleventyConfig.addPassthroughCopy({
    public: ".",
    styles: "styles",
    "node_modules/@fontsource/mona-sans/files": "styles/files",
    "node_modules/@fontsource/jetbrains-mono/files": "styles/files",
  });


  const markdownIt = require("markdown-it");
  const markdownItShiki = require("markdown-it-shiki").default;

  const md = markdownIt({
    html: true,
    breaks: true,
    linkify: true,
  });

  md.use(markdownItShiki, {
    theme: "vitesse-black",
  });

  eleventyConfig.setLibrary("md", md);

  return {
    dir: {
      input: ".",
      output: "dist",
    },
    passthroughFileCopy: true,
  };
};
