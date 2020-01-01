const path = require('path');
const webpack = require('webpack');
const TerserPlugin = require('terser-webpack-plugin');

const obfuscate = true;

const minimizer = [];
if (obfuscate) {
    minimizer.push(new TerserPlugin({
        sourceMap: true,
        terserOptions: {
            ecma: 5,
            mangle: {
                toplevel: true,
                properties: {
                    regex: /^_.+$/
                }
            }
        }
    }));
}
module.exports = {
    mode: 'production',
    entry: {
        main: './build/index.js',
        network: './build/network.js'
    },
    output: {
        filename: '[name].js',
        chunkFilename: '[name].bundle.js',
        path: path.resolve(__dirname, 'dist')
    },
    target: 'web',
    plugins: [
        new webpack.SourceMapDevToolPlugin({
            filename: '[name].js.map',
        })
    ],
    module: {
        rules: [
            {
                test: /\.js$/,
                use: ["source-map-loader"],
                enforce: "pre"
            }
        ]
    },
    optimization: {
        minimize: true,
        minimizer: minimizer,
    },
};