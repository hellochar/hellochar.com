const path = require('path');
const webpack = require('webpack');
const BundleAnalyzerPlugin = require('webpack-bundle-analyzer').BundleAnalyzerPlugin;
const merge = require('webpack-merge');

const common = require('./webpack.common.js');

module.exports = merge(common, {
  devtool: 'inline-source-map',
  devServer: {
      contentBase: path.join(__dirname, "public"),
      disableHostCheck: true,
      host: "localhost",
      historyApiFallback: true
  },
  plugins: [
    // new BundleAnalyzerPlugin({
    //   analyzerMode: 'static'
    // }),
    new webpack.optimize.CommonsChunkPlugin({
      name: 'node-static',
      minChunks(module, count) {
        var context = module.context;
        return context && context.indexOf('node_modules') >= 0;
      },
    }),
  ],
});
