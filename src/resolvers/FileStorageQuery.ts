import type { IObjectTypeResolver } from '@graphql-tools/utils';
import type { InputFilter, Context } from '@via-profit-services/core';
import type { ImageTransform } from '@via-profit-services/file-storage';
import { buildQueryFilter, buildCursorConnection, ServerError } from '@via-profit-services/core';


type ListArgs = InputFilter & {
  transform?: ImageTransform;
}

const FileStorageQuery: IObjectTypeResolver<any, Context, any> = {
  file: (parent, args) => args,
  list: async (parent, args: ListArgs, context) => {
    const { transform } = args;
    const { logger, services, dataloader } = context;
    const filter = buildQueryFilter(args);

    try {
      const filesConnection = await services.files.getFiles(filter);
      const connection = buildCursorConnection(filesConnection, 'files');

      if (transform) {
        connection.edges = connection.edges.map(({ node, cursor }) => ({
          cursor,
          node: {
            ...node,
            transform,
          },
        }));
      }

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
