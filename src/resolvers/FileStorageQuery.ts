import { buildQueryFilter, buildCursorConnection, ServerError } from '@via-profit-services/core';
import type { Resolvers } from '@via-profit-services/file-storage';


const FileStorageQuery: Resolvers['FileStorageQuery'] = {
  file: (_parent, args) => args,
  list: async (_parent, args, context) => {
    const { logger, services, dataloader } = context;
    const filter = buildQueryFilter(args);

    try {
      const filesConnection = await services.files.getFiles(filter);
      const connection = buildCursorConnection(filesConnection, 'files');

      filesConnection.nodes.forEach((node) => {
        dataloader.files
          .clear(node.id)
          .prime(node.id, node);
      });

      return connection;
    } catch (err) {
      logger.files.error('Failed to get Files list', { err });
      throw new ServerError('Failed to get Files list', { err });
    }
  },
};

export default FileStorageQuery;
