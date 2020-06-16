/* eslint-disable import/max-dependencies */
import { IResolvers } from 'graphql-tools';

import FileUpload from '../FileUploadScalar';
import { ExtendedContext } from '../types';
import ApplyTemporary from './ApplyTemporary';
import DeleteFiles from './DeleteFiles';
import File from './File';
import FilesListConnection from './FilesListConnection';
import Update from './Update';
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
    upload: UploadFiles,
    delete: DeleteFiles,
    update: Update,
    uploadTemporary: UploadTemporaryFiles,
    applyTemporary: ApplyTemporary,
  },
  File,
  // scalar
  FileUpload,
};

export default resolvers;
