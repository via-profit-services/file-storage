import { knexExternals } from '@via-profit-services/knex/dist/webpack-utils';
import { Configuration } from 'webpack';

const webpackBaseConfig: Configuration = {
  target: 'node',
  module: {
    rules: [
      {
        test: /\.ts$/,
        use: 'ts-loader',
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
    /^@via-profit-services\/core/,
    /^@via-profit-services\/knex/,
    /^@via-profit-services\/redis/,
    /^@via-profit-services\/accounts/,
    /^@via-profit-services\/sms/,
    /^@via-profit-services\/subscriptions/,
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
