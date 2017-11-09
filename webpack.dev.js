const path = require("path");
const merge = require('webpack-merge');

const common = require('./webpack.common.js');

module.exports = merge(common, {
  devtool: 'inline-source-map',
  devServer: {
      historyApiFallback: true,
      contentBase: path.join(__dirname, "public"),
  },
});
