import {
  buildQueryFilter,
  buildCursorConnection,
  TInputFilter,
  ServerError,
} from '@via-profit-services/core';
import { IFieldResolver } from 'graphql-tools';

import { Context } from '../../../context';
import createLoaders from '../loaders';
import FileStorageService from '../service';
import { IImageTransform } from '../types';

const FilesListConnectionResolver: IFieldResolver<any, Context, TArgs> = async (
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

    loaders.files.clearAll();


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
      loaders.files.prime(node.id, node);
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
