import { ServerError } from '@via-profit-services/core';
import { Resolvers } from '@via-profit-services/file-storage';

const deleteResolver: Resolvers['FileStorageMutation']['delete'] = async (
  _parent, args, context,
) => {
  const { ids, owners } = args;
  const { logger, services, dataloader } = context;

  let deletedIDs: string[] = [];

  // get by IDs
  if (ids && Array.isArray(ids)) {
    try {
      logger.files.debug(`Will be deleted ${ids.length} file(s)`);
      deletedIDs = await services.files.deleteStaticFiles(ids);
    } catch (err) {
      logger.files.error('Failed to Delete files', { err });
      throw new ServerError('Failed to Delete files', { err });
    }
  }

  if (owners && Array.isArray(owners)) {
    const files = await services.files.getFiles({
      where: [
        ['owner', 'in', owners],
      ],
    });

    const idsByOwner = files.nodes.map((node) => node.id);
    if (idsByOwner.length) {
      try {
        logger.files.debug(`Will be deleted ${idsByOwner} file(s)`);
        deletedIDs = await services.files.deleteStaticFiles(idsByOwner);
      } catch (err) {
        throw new ServerError('Failed to Delete files', { err });
      }
    }
  }

  deletedIDs.forEach((id) => {
    dataloader.files.clear(id);
    logger.files.debug('File ${id} was deleted.');
  });

  return {
    deletedIDs,
  };
};

export default deleteResolver;
