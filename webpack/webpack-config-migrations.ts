import { webpackMigrationsConfig } from '@via-profit-services/knex/dist/webpack-utils';
import { merge } from 'webpack-merge';

import webpackBaseConfig from './webpack-config-base';

export default merge(
  webpackBaseConfig,
  webpackMigrationsConfig(),
  { mode: 'production' },
);

