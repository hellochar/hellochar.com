const ExtractTextPlugin = require("extract-text-webpack-plugin");
const HtmlWebpackPlugin = require('html-webpack-plugin');
const path = require("path");
const webpack = require('webpack');

module.exports = {
  entry: {
    main: "./src/index.tsx",
  },
  output: {
    publicPath: "/",
    path: path.resolve(__dirname, "public"),
    filename: "[name].js",
    chunkFilename: '[name].bundle.js',
  },
  module: {
    rules: [
      {
        test: /\.tsx?$/,
        use: "ts-loader",
        exclude: /node_modules/
      },
      {
        test: /\.scss$/,
        use: ExtractTextPlugin.extract({
          fallback: 'style-loader',
          use: ['css-loader', 'sass-loader']
        })
      }
    ]
  },
  resolve: {
    extensions: [".tsx", ".ts", ".js"],
    alias: {
      'three-examples': path.resolve(__dirname, 'node_modules/three/examples/js/')
    }
  },
  plugins: [
    new ExtractTextPlugin('style.css'),
    new HtmlWebpackPlugin({
      filename: 'index.html',
      template: 'src/index.template.html'
    }),
    new webpack.optimize.CommonsChunkPlugin({
      name: 'node-static',
      minChunks(module, count) {
        var context = module.context;
        return context && context.indexOf('node_modules') >= 0;
      },
    }),
  ]
};
