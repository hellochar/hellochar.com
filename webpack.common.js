const HtmlWebpackInlineSourcePlugin = require('html-webpack-inline-source-plugin');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const path = require("path");
const merge = require('webpack-merge');

const config = {
  output: {
    publicPath: "/",
    path: path.resolve(__dirname, "public"),
    filename: "[name].js",
    chunkFilename: '[name].bundle.js',
  },
  optimization: {
    splitChunks: {
      chunks: "all"
    }
  },
  module: {
    rules: [
      {
        test: /\.tsx?$/,
        use: "ts-loader",
        exclude: /node_modules/
      },
      // don't handle scss here; do it in prod/dev since they're done differently
      // {
      //   test: /\.scss$/,
      //   use: [
      //     // MiniCssExtractPlugin.loader,
      //     "style-loader",
      //     'css-loader',
      //     'sass-loader'
      //   ]
      // },
      {
        test: /\.(vert|frag|glsl)$/,
        use: "webpack-glsl-loader"
      }
    ]
  },
  resolve: {
    extensions: [".tsx", ".ts", ".js"],
    alias: {
      'three-examples': path.resolve(__dirname, 'node_modules/three/examples/js/')
    }
  },
};

const isKiosk = !!process.env.KIOSK;

if (isKiosk) {
  module.exports = merge(config, {
    entry: {
      kiosk: "./openpose_kiosk/src/index.tsx",
    },
    plugins: [
      new HtmlWebpackPlugin({
        filename: 'kiosk.html',
        inlineSource: ".css$",
        template: 'src/index.template.html',
      }),
      new HtmlWebpackInlineSourcePlugin(),
    ]
  });
} else {
  module.exports = merge(config, {
    entry: {
      main: "./src/index.tsx",
    },
    plugins: [
      new HtmlWebpackPlugin({
        filename: 'index.html',
        inlineSource: ".css$",
        template: 'src/index.template.html',
      }),
      new HtmlWebpackInlineSourcePlugin(),
    ]
  });
}
