import { IResolvers } from 'graphql-tools';

import FileUpload from '../FileUploadScalar';
import { ExtendedContext } from '../types';
import DeleteFiles from './DeleteFiles';
import File from './File';
import FilesListConnection from './FilesListConnection';
import TemporaryFile from './TemporaryFile';
import UploadFiles from './UploadFiles';
import UploadTemporaryFiles from './UploadTemporaryFiles';

const resolvers: IResolvers<any, ExtendedContext> = {
  Query: {
    fileStorage: () => ({}),
  },
  Mutation: {
    fileStorage: () => ({}),
  },
  FileStorageQuery: {
    list: FilesListConnection,
    file: (parent, args) => args,
  },
  FileStorageMutation: {
    delete: DeleteFiles,
    upload: UploadFiles,
    uploadTemporary: UploadTemporaryFiles,
  },
  File,
  TemporaryFile,
  // scalar
  FileUpload,
};

export default resolvers;
