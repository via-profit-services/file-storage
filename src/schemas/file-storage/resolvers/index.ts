import { IResolvers } from 'graphql-tools';

import { Context } from '../../../context';
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
};

export default resolvers;
