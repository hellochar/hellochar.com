const path = require("path");

module.exports = {
    devServer: {
        historyApiFallback: true,
        contentBase: path.join(__dirname, "public"),
    },
    devtool: 'inline-source-map',
    entry: "./src/index.tsx",
    output: {
        publicPath: "/",
        path: path.resolve(__dirname, "public"),
        filename: "app.js"
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
                use: [{
                    loader: "style-loader" // creates style nodes from JS strings
                }, {
                    loader: "css-loader" // translates CSS into CommonJS
                }, {
                    loader: "sass-loader" // compiles Sass to CSS
                }]
            }
        ]
    },
    resolve: {
        extensions: [".tsx", ".ts", ".js"]
    }
};