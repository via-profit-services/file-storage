import type { IFieldResolver } from '@graphql-tools/utils';
import { ServerError, Context } from '@via-profit-services/core';


interface DeleteFilesArgs {
  ids?: string[];
  owners?: string[];
}

const deleteResolver: IFieldResolver<any, Context, DeleteFilesArgs> = async (
  parent, args, context,
) => {
  const { ids, owners } = args;
  const { logger, token, services, dataloader } = context;
  const { uuid } = token;
  let deletedIDs: string[] = [];

  // get by IDs
  if (ids && Array.isArray(ids)) {
    try {
      logger.files.debug(`Will be deleted ${ids.length} file(s)`, { uuid });
      deletedIDs = await services.files.deleteStaticFiles(ids);
    } catch (err) {
      logger.files.error('Failed to Delete files', { err, uuid });
      throw new ServerError('Failed to Delete files', { err, uuid });
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
        logger.files.debug(`Will be deleted ${idsByOwner} file(s)`, { uuid });
        deletedIDs = await services.files.deleteStaticFiles(idsByOwner);
      } catch (err) {
        throw new ServerError('Failed to Delete files', { err, uuid });
      }
    }
  }

  deletedIDs.forEach((id) => {
    dataloader.files.clear(id);
    logger.files.debug(`File ${id} was deleted. Initiator: Account ${uuid}`);
  });

  return {
    deletedIDs,
  };
};

export default deleteResolver;
