const path = require("path");

module.exports = {
    devServer: {
        contentBase: path.join(__dirname, "docs"),
    },
    devtool: 'inline-source-map',
    entry: "./src/index.tsx",
    output: {
        path: path.resolve(__dirname, "docs"),
        filename: "app.js"
    },
    module: {
        rules: [
            {
                test: /\.tsx?$/,
                use: "ts-loader",
                exclude: /node_modules/
            }
        ]
    },
    resolve: {
        extensions: [".tsx", ".ts", ".js"]
    }
};