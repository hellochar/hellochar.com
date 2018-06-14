const path = require('path');
const BundleAnalyzerPlugin = require('webpack-bundle-analyzer').BundleAnalyzerPlugin;
const webpack = require('webpack');
const merge = require('webpack-merge');

const common = require('./webpack.common.js');

module.exports = merge(common, {
  mode: "development",
  devtool: 'inline-source-map',
  devServer: {
    contentBase: path.join(__dirname, "public"),
    disableHostCheck: true,
    host: "0.0.0.0",
    hot: true,
    historyApiFallback: true,
    useLocalIp: true,
  },
  module: {
    rules: [
      {
        test: /\.scss$/,
        use: [
          // MiniCssExtractPlugin.loader,
          "style-loader",
          { loader: 'css-loader', options: { importLoaders: 2 } },
          "postcss-loader",
          'sass-loader'
        ]
      },
    ],
  },
  plugins: [
    new webpack.HotModuleReplacementPlugin(),
    // new BundleAnalyzerPlugin({
    //   analyzerMode: 'static'
    // }),
  ],
});
