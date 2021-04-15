import type { Resolvers } from '@via-profit-services/file-storage';

import File from './File';
import FileStorageMutation from './FileStorageMutation';
import FileStorageQuery from './FileStorageQuery';
import Mutation from './Mutation';
import Query from './Query';
import scalars from './scalars';
import TemporaryFile from './TemporaryFile';
import TransformedFile from './TransformedFile';


const resolvers: Resolvers = {
  File,
  TransformedFile,
  FileStorageQuery,
  FileStorageMutation,
  Mutation,
  Query,
  TemporaryFile,
  ...scalars,
}

export default resolvers;
