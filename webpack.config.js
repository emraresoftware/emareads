const path = require('path');
const CopyPlugin = require('copy-webpack-plugin');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');

const target = process.env.TARGET || 'chrome';

module.exports = {
  entry: {
    background: './src/background/service-worker.ts',
    content: './src/content/content-script.ts',
    popup: './src/popup/popup.tsx',
    options: './src/options/options.tsx',
    injected: './src/content/injected-script.ts'
  },
  output: {
    path: path.resolve(__dirname, `dist/${target}`),
    filename: '[name].js',
    clean: true
  },
  module: {
    rules: [
      {
        test: /\.tsx?$/,
        use: 'ts-loader',
        exclude: /node_modules/
      },
      {
        test: /\.css$/,
        use: [MiniCssExtractPlugin.loader, 'css-loader', 'postcss-loader']
      }
    ]
  },
  resolve: {
    extensions: ['.tsx', '.ts', '.js'],
    alias: {
      '@': path.resolve(__dirname, 'src'),
      '@shared': path.resolve(__dirname, 'src/shared')
    }
  },
  plugins: [
    new MiniCssExtractPlugin({
      filename: '[name].css'
    }),
    new CopyPlugin({
      patterns: [
        { 
          from: 'public/manifest.json',
          to: 'manifest.json',
          transform(content) {
            const manifest = JSON.parse(content);
            return JSON.stringify(manifest, null, 2);
          }
        },
        { from: 'public/icons', to: 'icons' }
      ]
    }),
    new HtmlWebpackPlugin({
      template: './src/popup/popup.html',
      filename: 'popup.html',
      chunks: ['popup']
    }),
    new HtmlWebpackPlugin({
      template: './src/options/options.html',
      filename: 'options.html',
      chunks: ['options']
    })
  ],
  optimization: {
    minimize: process.env.NODE_ENV === 'production'
  }
};
