const path = require("path");
const merge = require('webpack-merge');

const common = require('./webpack.common.js');

module.exports = merge(common, {
  devtool: 'inline-source-map',
  devServer: {
      contentBase: path.join(__dirname, "public"),
      disableHostCheck: true,
      host: "0.0.0.0",
      historyApiFallback: true
  },
});
