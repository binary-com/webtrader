'use strict';

var webpack = require('webpack');

var plugins = [
    new webpack.optimize.OccurenceOrderPlugin(),
    new webpack.DefinePlugin({
        'process.env.NODE_ENV': JSON.stringify(process.env.NODE_ENV)
    })
];

var is_production =  process.env.NODE_ENV === 'production';
if (is_production) {
    plugins.push(
        new webpack.optimize.UglifyJsPlugin({
            compressor: {
                screw_ie8: true,
                warnings: false
            }
        })
    );
}

module.exports = {
    entry: [
        'babel/polyfill',
        './src/index'
    ],
    module: {
        loaders: [{
            test: /\.js$/,
            loaders: ['babel-loader'],
            exclude: /node_modules/
        }]
    },
    output: {
        library: 'binary-live-api',
        libraryTarget: 'umd',
        path: 'dist',
        filename: is_production ? 'binary-live-api.min.js' : 'binary-live-api.js'
    },
    plugins: plugins,
    resolve: {
        extensions: ['', '.js']
    }
};
