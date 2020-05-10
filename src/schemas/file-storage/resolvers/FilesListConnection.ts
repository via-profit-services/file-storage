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

const FilesListConnectionResolver: IFieldResolver<any, Context, TInputFilter> = async (
  parent, args, context,
) => {
  const { logger } = context;
  const filter = buildQueryFilter(args);
  const fileService = new FileStorageService({ context });
  const loaders = createLoaders(context);

  try {
    const filesConnection = await fileService.getFiles(filter);
    const connection = buildCursorConnection(filesConnection, 'files');

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

export default FilesListConnectionResolver;
