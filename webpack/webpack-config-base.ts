import { knexExternals } from '@via-profit-services/knex/dist/webpack-utils';
import { Configuration } from 'webpack';
import 'string-replace-loader';

const webpackBaseConfig: Configuration = {
  target: 'node',
  module: {
    rules: [
      {
        test: /\.ts$/,
        use: 'ts-loader',
      },
      {
        test: /streamsearch\/lib\/sbmh\.js$/,
        loader: 'string-replace-loader',
        options: {
          multiple: [
            {
              search: 'this._lookbehind = new Buffer(needle_len)',
              replace: 'this._lookbehind = Buffer.alloc(needle_len)',
            },
            {
              search: 'needle = new Buffer(needle)',
              replace: 'needle = Buffer.from(needle)',
            },
            {
              search: 'chunk = new Buffer(chunk, \'binary\')',
              replace: 'chunk = Buffer.from(chunk, 0, \'binary\')',
            },
          ],
        },
      },
      {
        test: /busboy\/deps\/encoding\/encoding\.js$/,
        loader: 'string-replace-loader',
        options: {
          search: 'return new Buffer(bytes)',
          replace: 'return Buffer.from(bytes)',
        },
      },
      {
        test: /\.graphql$/,
        use: 'raw-loader',
      },
    ],
  },
  node: {
    __filename: true,
    __dirname: true,
  },
  resolve: {
    extensions: ['.ts', '.js', '.graphql'],
  },
  externals: [
    ...knexExternals,
    /^@via-profit\/dataloader/,
    /^@via-profit-services\/core/,
    /^@via-profit-services\/knex/,
    /^@via-profit-services\/redis/,
    /^express$/,
    /^moment$/,
    /^moment-timezone$/,
    /^uuid$/,
    /^dataloader$/,
    /^winston$/,
    /^graphql$/,
    /^winston-daily-rotate-file$/,
    /^rimraf$/,
    /^imagemin$/,
    /^imagemin-mozjpeg$/,
    /^imagemin-optipng$/,
    /^imagemin-pngquant$/,
    /^jimp$/,
  ],
}

export default webpackBaseConfig;
