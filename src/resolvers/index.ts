/* eslint-disable import/max-dependencies */
import { IResolvers } from '@graphql-tools/utils';

import ApplyTemporary from './ApplyTemporary';
import DeleteFiles from './DeleteFiles';
import File from './File';
import FileStorageQuery from './FileStorageQuery';
import FileStorateMutation from './FileStorateMutation';
import Mutation from './Mutation';
import Query from './Query';
import TemporaryFile from './TemporaryFile';
import Update from './Update';
import UploadFiles from './UploadFiles';
import UploadTemporaryFiles from './UploadTemporaryFiles';
import scalars from './scalars';

const resolvers: IResolvers = {
  File,
  FileStorageQuery,
  FileStorateMutation,
  Mutation,
  Query,
  TemporaryFile,
  Update,
  UploadFiles,
  UploadTemporaryFiles,
  ApplyTemporary,
  DeleteFiles,
  ...scalars,
}

export default resolvers;
