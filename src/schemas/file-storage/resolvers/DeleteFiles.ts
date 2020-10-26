import { IFieldResolver, ServerError, TWhereAction } from '@via-profit-services/core';

import createLoaders from '../loaders';
import FileStorageService from '../service';
import { ExtendedContext } from '../types';

interface TArgs {
  ids?: string[];
  owners?: string[];
}

const DeleteFilesResolver: IFieldResolver<any, ExtendedContext, TArgs> = async (
  parent, args, context,
) => {
  const { ids, owners } = args;
  const { logger, token } = context;
  const { uuid } = token;

  const fileService = new FileStorageService({ context });
  const loaders = createLoaders(context);
  let deletedIDs: string[] = [];

  // get by IDs
  if (ids && Array.isArray(ids)) {
    try {
      logger.fileStorage.debug(`Will be deleted ${ids.length} file(s)`, { uuid });
      deletedIDs = await fileService.deleteStaticFiles(ids);
    } catch (err) {
      logger.fileStorage.error('Failed to Delete files', { err, uuid });
      throw new ServerError('Failed to Delete files', { err, uuid });
    }
  }

  if (owners && Array.isArray(owners)) {
    const files = await fileService.getFiles({
      where: [
        ['owner', TWhereAction.IN, owners],
      ],
    });

    const idsByOwner = files.nodes.map((node) => node.id);
    if (idsByOwner.length) {
      try {
        logger.fileStorage.debug(`Will be deleted ${idsByOwner} file(s)`, { uuid });
        deletedIDs = await fileService.deleteStaticFiles(idsByOwner);
      } catch (err) {
        throw new ServerError('Failed to Delete files', { err, uuid });
      }
    }
  }

  deletedIDs.forEach((id) => {
    loaders.files.clear(id);
    logger.fileStorage.debug(`File ${id} was deleted. Initiator: Account ${uuid}`);
  });

  return {
    deletedIDs,
  };
};

export default DeleteFilesResolver;
