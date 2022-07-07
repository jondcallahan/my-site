const { sqip } = require("sqip");

sqip({
  input: "./public/images/headshot_bw.jpg",
})
  .then(console.log)
  .catch(console.error);
