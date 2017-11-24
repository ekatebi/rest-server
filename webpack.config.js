var webpack = require('webpack');
var path = require('path');
var fs = require('fs');

var nodeModules = {};
fs.readdirSync('node_modules')
  .filter(function(x) {
    return ['.bin'].indexOf(x) === -1;
  })
  .forEach(function(mod) {
    nodeModules[mod] = 'commonjs ' + mod;
  });

module.exports = {
  module: {
    rules: [
/*
      {
        enforce: 'pre',
        test: /\.js$/,
        loader: 'eslint-loader',
        include: path.resolve(__dirname, './'),
        exclude: /node_modules/
      },
*/
      {
        test: /\.js$/,
        loaders: ['babel-loader'],
        include: path.resolve(__dirname, './'),
        exclude: /node_modules/
      }
    ]
  },
  entry: './app.js',
  target: 'node',
  output: {
    path: path.join(__dirname, 'dist'),
    filename: 'app.js'
  },
  node: {
    __dirname: true,
    __filename: true
  },

  externals: nodeModules,
  plugins: [
    new webpack.IgnorePlugin(/\.(css|less)$/),
//    new webpack.BannerPlugin('require("source-map-support").install();',
//                             { raw: true, entryOnly: false })
  ],
  devtool: 'sourcemap'
}
