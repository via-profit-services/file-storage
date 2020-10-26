import {
  buildQueryFilter,
  buildCursorConnection,
  TInputFilter,
  ServerError,
  IFieldResolver,
} from '@via-profit-services/core';

import createLoaders from '../loaders';
import FileStorageService from '../service';
import { IImageTransform, ExtendedContext } from '../types';

const FilesListConnectionResolver: IFieldResolver<any, ExtendedContext, TArgs> = async (
  parent, args, context,
) => {
  const { transform } = args;
  const { logger } = context;
  const filter = buildQueryFilter(args);
  const fileService = new FileStorageService({ context });
  const loaders = createLoaders(context);

  try {
    const filesConnection = await fileService.getFiles(filter);
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
      loaders.files
        .clear(node.id)
        .prime(node.id, node);
    });

    return connection;
  } catch (err) {
    logger.fileStorage.error('Failed to get Files list', { err });
    throw new ServerError('Failed to get Files list', { err });
  }
};

type TArgs = TInputFilter & {
  transform?: IImageTransform;
}

export default FilesListConnectionResolver;
