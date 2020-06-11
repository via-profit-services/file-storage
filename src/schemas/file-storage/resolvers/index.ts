import { IResolvers } from 'graphql-tools';

import FileUpload from '../FileUploadScalar';
import { ExtendedContext } from '../types';
import DeleteFiles from './DeleteFiles';
import File from './File';
import FilesListConnection from './FilesListConnection';
import UploadFiles from './UploadFiles';

const resolvers: IResolvers<any, ExtendedContext> = {
  Query: {
    fileStorage: () => ({}),
  },
  Mutation: {
    fileStorage: () => ({}),
  },
  FileStorageQuery: {
    list: FilesListConnection,
  },
  FileStorageMutation: {
    delete: DeleteFiles,
    upload: UploadFiles,
  },
  File,

  // scalar
  FileUpload,
};

export default resolvers;
