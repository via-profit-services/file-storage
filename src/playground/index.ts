/* eslint-disable no-console */
import { makeExecutableSchema } from '@graphql-tools/schema';
import * as accounts from '@via-profit-services/accounts';
import * as core from '@via-profit-services/core';
import * as knex from '@via-profit-services/knex';
import * as subscriptions from '@via-profit-services/subscriptions';
import dotenv from 'dotenv';
import express from 'express';
import http from 'http';
import path from 'path';

import * as files from '../index';

dotenv.config();

const endpoint = '/graphql';
const PORT = 9005;
const app = express();
const server = http.createServer(app);
(async () => {

  const {
    fileStorageMiddleware,
    graphQLFilesStaticExpress,
    graphQLFilesUploadExpress,
  } = files.factory({
    hostname: 'http://localhost:9005',
  });

  const knexMiddleware = knex.factory({
    connection: {
      user: process.env.DB_USER,
      database: process.env.DB_NAME,
      password: process.env.DB_PASSWORD,
      host: process.env.DB_HOST,
    },
  });

  const pubSubMiddleware = subscriptions.factory({
    endpoint,
    server,
  })

  const accountsMiddleware = await accounts.factory({
    privateKey: path.resolve(__dirname, './jwtRS256.key'),
    publicKey: path.resolve(__dirname, './jwtRS256.key.pub'),
  });

  const schema = makeExecutableSchema({
    typeDefs: [
      core.typeDefs,
      accounts.typeDefs,
      subscriptions.typeDefs,
      files.typeDefs,
    ],
    resolvers: [
      core.resolvers,
      accounts.resolvers,
      subscriptions.resolvers,
      files.resolvers,
    ],
  });


  const { graphQLExpress } = await core.factory({
    server,
    schema,
    debug: true,
    introspection: true,
    middleware: [
      accountsMiddleware,
      knexMiddleware,
      pubSubMiddleware,
      fileStorageMiddleware,
    ],
  });

  app.use(endpoint, graphQLFilesUploadExpress); // <-- First
  app.use(graphQLFilesStaticExpress); // < -- Second
  app.use(endpoint, graphQLExpress); // < -- Third

  server.listen(PORT, () => {
    console.log(`GraphQL Server started at http://localhost:${PORT}/graphql`);
    console.log(`Subscriptions server started at ws://localhost:${PORT}/graphql`);
  })

})();
