/* eslint-disable import/no-extraneous-dependencies */
import { App, schemas } from '@via-profit-services/core';
import chalk from 'chalk';
import { v4 as uuidv4 } from 'uuid';

import { makeSchema } from '../schemas/file-storage';
import { configureApp } from '../utils/configureApp';

const fileStorage = makeSchema({
  hostname: `http://localhost:${process.env.PORT}`,
});

const config = configureApp({
  typeDefs: [
    fileStorage.typeDefs,
  ],
  permissions: [
    fileStorage.permissions,
  ],
  resolvers: [
    fileStorage.resolvers,
  ],
  expressMiddlewares: [
    fileStorage.expressMiddleware,
  ],
});

const app = new App(config);
const AuthService = schemas.auth.service;

app.bootstrap((props) => {
  const { resolveUrl, context } = props;
  if (process.env.NODE_ENV !== 'development') {
    console.log(`GraphQL server was started at ${resolveUrl.graphql}`);
    return;
  }

  console.log('');
  const authService = new AuthService({ context });
  const { accessToken } = authService.generateTokens({
    uuid: uuidv4(),
    roles: ['developer'],
  }, {
    access: 2.592e6,
    refresh: 2.592e6,
  });

  console.log(chalk.green('Your development token is:'));
  console.log(chalk.yellow(accessToken.token));
  console.log('');

  console.log('');
  console.log(chalk.green('============== Server =============='));
  console.log('');
  console.log(`${chalk.green('GraphQL server')}:     ${chalk.yellow(resolveUrl.graphql)}`);

  if (resolveUrl.playground) {
    console.log(`${chalk.magenta('GraphQL playground')}: ${chalk.yellow(resolveUrl.playground)}`);
  }
  if (resolveUrl.voyager) {
    console.log(`${chalk.magenta('GraphQL voyager')}:    ${chalk.yellow(resolveUrl.voyager)}`);
  }

  console.log('');
});
