import { IResolvers } from 'graphql-tools';

import FileUpload from '../FileUploadScalar';
import { Context } from '../types';
import DeleteFiles from './DeleteFiles';
import File from './File';
import FilesListConnection from './FilesListConnection';
import UploadFiles from './UploadFiles';

const resolvers: IResolvers<any, Context> = {
  Query: {
    fileStorage: () => ({}),
  },
  Mutation: {
    fileStorage: () => ({}),
  },
  FileStorageQuery: {
    list: FilesListConnection,
    image: (parent, args: any) => (args),
  },
  FileStorageMutation: {
    delete: DeleteFiles,
    upload: UploadFiles,
  },
  File,
  Image: File,

  // scalar
  FileUpload,
};

export default resolvers;
