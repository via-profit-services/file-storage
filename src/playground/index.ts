/* eslint-disable no-console */
/* eslint-disable import/no-extraneous-dependencies */
import { App, schemas } from '@via-profit-services/core';
import chalk from 'chalk';
import { v4 as uuidv4 } from 'uuid';

import { makeSchema } from '../schemas/file-storage';
// import FileStorageService from '../schemas/file-storage/service';

import { configureApp } from '../utils/configureApp';

const fileStorage = makeSchema({
  hostname: `http://localhost:${process.env.PORT}`,
  cacheTTL: 30,
  temporaryTTL: 30,
});


const config = configureApp({
  typeDefs: [
    fileStorage.typeDefs,
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

app.bootstrap(async (props) => {
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

  // const fsService = new FileStorageService({ context });
  // const { stream, file } = await fsService.getFileStream({
  //   mimeType: 'application/json',
  //   category: 'test',
  //   owner: '34849cc0-0121-48e7-8091-108f04278b68',
  //   type: FileType.document,
  // });

  // console.log('file', file);
  // stream.write('{"foo": "bar"}');

  console.log(chalk.green('Your development token is:'));
  console.log(chalk.yellow(accessToken.token));
  console.log('');

  console.log('');
  console.log(chalk.green('============== Server =============='));
  console.log('');
  console.log(`${chalk.green('GraphQL server')}:     ${chalk.yellow(resolveUrl.graphql)}`);

  if (resolveUrl.voyager) {
    console.log(`${chalk.magenta('GraphQL voyager')}:    ${chalk.yellow(resolveUrl.voyager)}`);
  }

  console.log('');
});
