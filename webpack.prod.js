const MiniCssExtractPlugin = require("mini-css-extract-plugin");
const path = require("path");
const merge = require('webpack-merge');
// const BundleBuddyWebpackPlugin = require("bundle-buddy-webpack-plugin");

const common = require('./webpack.common.js');

module.exports = merge(common, {
  mode: "production",
  module: {
    rules: [
      {
        test: /\.scss$/,
        use: [
          MiniCssExtractPlugin.loader,
          // "style-loader",
          {
            loader: 'css-loader',
            options: {
              minimize: true,
            }
          },
          'sass-loader'
        ]
      },
    ],
  },
  plugins: [
    new MiniCssExtractPlugin({
      // Options similar to the same options in webpackOptions.output
      // both options are optional
      filename: "[name].css",
      chunkFilename: "[id].css"
    }),
    // new BundleBuddyWebpackPlugin(),
  ]
});
