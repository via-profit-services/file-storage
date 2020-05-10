const path = require('path');
const FileManagerPlugin = require('filemanager-webpack-plugin');
const { ProgressPlugin, IgnorePlugin, BannerPlugin } = require('webpack');
const merge = require('webpack-merge');
const nodeExternals = require('webpack-node-externals');
const baseConfig = require('./webpack.config.base');

module.exports = merge(baseConfig, {
  entry: {
    index: path.resolve(__dirname, '../src/index.ts'),
  },
  output: {
    path: path.join(__dirname, '../dist/'),
    filename: '[name].js',
    libraryTarget: 'commonjs2',
  },
  mode: 'production',
  plugins: [
    new ProgressPlugin(),
    new IgnorePlugin(/m[sy]sql2?|oracle(db)?|sqlite3/),
    new IgnorePlugin(/pg-native/),
    new IgnorePlugin(/pg-query-stream/),
    new BannerPlugin({
      banner: `
 Via Profit Services / Settings Manager

 Repository https://gitlab.com/via-profit-services/file-storage
 Contact    promo@via-profit.ru
 Website    https://via-profit.ru
      `,
    }),
    new FileManagerPlugin({
      onStart: {
        delete: ['./dist'],
      },
      onEnd: {
        copy: [
          {
            source: './src/database/migrations/*',
            destination: './dist/database/migrations/',
          },
          {
            source: './src/database/seeds/*',
            destination: './dist/database/seeds/',
          },
        ],
        delete: [
          './dist/playground',
          './dist/database/migrations/!(+([0-9])_file-storage-*@(.ts|.d.ts))',
        ],
      },
    }),
  ],

  externals: [nodeExternals()],
});
