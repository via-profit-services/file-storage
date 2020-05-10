import { ServerError } from '@via-profit-services/core';
import { IFieldResolver } from 'graphql-tools';

import { Context } from '../../../context';
import createLoaders from '../loaders';
import FileStorageService from '../service';

interface TArgs {
  ids: string[];
}

const DeleteFilesResolver: IFieldResolver<any, Context, TArgs> = async (
  parent, args, context,
) => {
  const { ids } = args;
  const { logger, token } = context;
  const { uuid } = token;

  const fileService = new FileStorageService({ context });
  const loaders = createLoaders(context);

  try {
    const deletedIds = await fileService.deleteFiles(ids);

    deletedIds.forEach((id) => {
      loaders.files.clear(id);
      logger.fileStorage.debug(`File ${id} was deleted. Initiator: Account ${uuid}`);
    });

    if (deletedIds.length !== ids.length) {
      logger.fileStorage.debug(
        'Not all files were deleted, because some of them were not found in the database',
      );
    }

    return true;
  } catch (err) {
    logger.fileStorage.error('Failed to Delete files', { err, uuid });
    throw new ServerError('Failed to Delete files', { err, uuid });
  }
};

export default DeleteFilesResolver;
