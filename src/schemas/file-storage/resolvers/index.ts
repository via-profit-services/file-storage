/* eslint-disable import/max-dependencies */
import { IResolvers } from '@via-profit-services/core';

import ApplyTemporary from '../../../resolvers/ApplyTemporary';
import DeleteFiles from '../../../resolvers/DeleteFiles';
import UploadTemporaryFiles from '../../../resolvers/UploadTemporaryFiles';
import FileUpload from '../FileUploadScalar';
import { ExtendedContext } from '../types';
import File from './File';
import FilesListConnection from './FilesListConnection';
import TemporaryFile from './TemporaryFile';
import Update from './Update';
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
  TemporaryFile,
  // scalar
  FileUpload,
};

export default resolvers;
