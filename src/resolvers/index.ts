/* eslint-disable import/max-dependencies */
import { IResolvers } from '@graphql-tools/utils';

import File from './File';
import FileStorageMutation from './FileStorageMutation';
import FileStorageQuery from './FileStorageQuery';
import Mutation from './Mutation';
import Query from './Query';
import scalars from './scalars';
import TemporaryFile from './TemporaryFile';


const resolvers: IResolvers = {
  File,
  FileStorageQuery,
  FileStorageMutation,
  Mutation,
  Query,
  TemporaryFile,
  ...scalars,
}

export default resolvers;
