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


dotenv.config();

const PORT = 9005;
const app = express();
const server = http.createServer(app);
(async () => {

  const knexMiddleware = knex.factory({
    connection: {
      user: process.env.DB_USER,
      database: process.env.DB_NAME,
      password: process.env.DB_PASSWORD,
      host: process.env.DB_HOST,
    },
  });

  const pubSubMiddleware = subscriptions.factory({
    endpoint: '/graphql',
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
    ],
    resolvers: [
      core.resolvers,
      accounts.resolvers,
      subscriptions.resolvers,
    ],
  });


  const { viaProfitGraphql } = await core.factory({
    server,
    schema,
    debug: true,
    enableIntrospection: true,
    middleware: [
      accountsMiddleware,
      knexMiddleware,
      pubSubMiddleware,
    ],
  });

  app.use(viaProfitGraphql);
  server.listen(PORT, () => {
    console.log(`GraphQL Server started at http://localhost:${PORT}/graphql`);
    console.log(`Subscriptions server started at ws://localhost:${PORT}/graphql`);
  })

})();
