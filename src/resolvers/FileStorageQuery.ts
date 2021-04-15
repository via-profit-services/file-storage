import { buildQueryFilter, buildCursorConnection, ServerError } from '@via-profit-services/core';
import type { Resolvers } from '@via-profit-services/file-storage';


const FileStorageQuery: Resolvers['FileStorageQuery'] = {
  file: (_parent, args) => args,
  list: async (_parent, args, context) => {
    const { services } = context;
    const filter = buildQueryFilter(args);

    try {
      const filesConnection = await services.files.getFiles(filter);
      const connection = buildCursorConnection(filesConnection, 'files');

      return connection;
    } catch (err) {
      throw new ServerError('Failed to get Files list', { err });
    }
  },
};

export default FileStorageQuery;
