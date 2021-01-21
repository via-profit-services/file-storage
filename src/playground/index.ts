/* eslint-disable import/max-dependencies */
/* eslint-disable no-console */
import { makeExecutableSchema } from '@graphql-tools/schema';
import * as core from '@via-profit-services/core';
import * as knex from '@via-profit-services/knex';
import * as redis from '@via-profit-services/redis';
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
const redisConfig = {
  host: 'localhost',
  password: '',
};
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
      fileStorageMiddleware,
    ],
  });

  app.use(endpoint, graphQLFilesUploadExpress); // <-- First
  app.use(graphQLFilesStaticExpress); // < -- Second
  app.use(endpoint, graphQLExpress); // < -- Third

  server.listen(PORT, () => {
    console.log(`GraphQL Server started at http://localhost:${PORT}/graphql`);
  })

})();
