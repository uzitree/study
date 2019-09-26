'use strict'

const path = require('path')
const webpack = require('webpack')
const UglifyESPlugin = require('uglifyjs-webpack-plugin')

const moduleObject = {
  rules: [
    {
      test: /.js$/,
      use: 'babel-loader'
    },
    {
      test: /.css$/,
      use: [
        'style-loader',
        'css-loader'
      ]
    },
    {
      test: /.(png|jpg|gif|jpeg)$/,
      use: [
        {
          loader: 'url-loader',
          options: {
            limit: 10240
          }
        }
      ]
    },
    {
      test: /\.js$/,
      loader: 'eslint-loader',
      enforce: 'pre',
      include: [path.resolve(__dirname, 'src')],
      options: {
        formatter: require('eslint-friendly-formatter')
      }
    }
  ]
}

const webConfig = {
  target: 'web',
  entry: './src/lazyload.js',
  output: {
    path: path.join(__dirname, './dist'),
    filename: 'lazyload.win.js',
    libraryTarget: 'window'
  },
  mode: 'development',
  module: moduleObject,
  plugins: [
    new webpack.HotModuleReplacementPlugin(),
    new UglifyESPlugin({
      uglifyOptions: {
        compress: {
          drop_console: true,
          collapse_vars: true,
          reduce_vars: true,
        },
        output: {
          beautify: false,
          comments: false,
        }
      }
    })
  ],
  devtool: 'source-map',
  devServer: {
    contentBase: './dist',
    hot: true
  }
}

const esConfig = {
  target: 'node',
  entry: './src/lazyload.js',
  output: {
    path: path.join(__dirname, './dist'),
    filename: 'lazyload.es.js'
  },
  mode: 'development',
  module: moduleObject,
  plugins: [
    new webpack.HotModuleReplacementPlugin(),
    new UglifyESPlugin({
      uglifyOptions: {
        compress: {
          drop_console: true,
          collapse_vars: true,
          reduce_vars: true,
        },
        output: {
          beautify: false,
          comments: false,
        }
      }
    })
  ],
  devtool: 'source-map',
  devServer: {
    contentBase: './dist',
    hot: true
  }
}

module.exports = [ webConfig, esConfig ]