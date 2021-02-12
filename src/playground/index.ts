/* eslint-disable import/max-dependencies */
/* eslint-disable no-console */
import { makeExecutableSchema } from '@graphql-tools/schema';
import * as core from '@via-profit-services/core';
import * as knex from '@via-profit-services/knex';
import * as redis from '@via-profit-services/redis';
import dotenv from 'dotenv';
import express from 'express';
import http from 'http';

import { factory as filesFactory } from '../index';

dotenv.config();

const app = express();
const server = http.createServer(app);
const redisConfig = {
  host: 'localhost',
  password: '',
};
(async () => {


  const files = await filesFactory({
    hostname: `http://${process.env.SERVER_HOST}:${process.env.SERVER_PORT}`,
  });

  const knexMiddleware = knex.factory({
    connection: {
      user: process.env.DB_USER,
      database: process.env.DB_NAME,
      password: process.env.DB_PASSWORD,
      host: process.env.DB_HOST,
    },
  });

  const redisMiddleware = redis.factory(redisConfig)

  const schema = makeExecutableSchema({
    typeDefs: [
      core.typeDefs,
      files.typeDefs,
    ],
    resolvers: [
      core.resolvers,
      files.resolvers,
    ],
  });


  const { graphQLExpress } = await core.factory({
    server,
    schema,
    debug: true,
    middleware: [
      knexMiddleware,
      redisMiddleware,
      files.fileStorageMiddleware,
    ],
  });

  app.use(process.env.GRAPHQL_ENDPOINT, files.graphQLFilesUploadExpress); // <-- First
  app.use(files.graphQLFilesStaticExpress); // < -- Second
  app.use(process.env.GRAPHQL_ENDPOINT, graphQLExpress); // <-- Last

  server.listen(Number(process.env.SERVER_PORT), process.env.SERVER_HOST, () => {
    console.log(`GraphQL Server started at http://${process.env.SERVER_HOST}:${process.env.SERVER_PORT}/graphql`);
  });

})();
