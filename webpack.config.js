const nodeExternals = require("webpack-node-externals");

// node_modules를 함께 패키징 할 필요는 없으므로...
// 서버에서 npm i 로 해결

module.exports = {
  entry: "./index.js",
  output: { filename: "./server.js" },
  target: "node",
  externals: [nodeExternals()],
};
