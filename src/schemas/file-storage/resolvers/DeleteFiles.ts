import { ServerError } from '@via-profit-services/core';
import { IFieldResolver } from 'graphql-tools';

import createLoaders from '../loaders';
import FileStorageService from '../service';
import { ExtendedContext } from '../types';

interface TArgs {
  ids: string[];
}

const DeleteFilesResolver: IFieldResolver<any, ExtendedContext, TArgs> = async (
  parent, args, context,
) => {
  const { ids } = args;
  const { logger, token } = context;
  const { uuid } = token;

  const fileService = new FileStorageService({ context });
  const loaders = createLoaders(context);

  let deletedIds: string[] = [];
  try {
    deletedIds = await fileService.deleteStaticFiles(ids);
  } catch (err) {
    logger.fileStorage.error('Failed to Delete files', { err, uuid });
    throw new ServerError('Failed to Delete files', { err, uuid });
  }


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
};

export default DeleteFilesResolver;
