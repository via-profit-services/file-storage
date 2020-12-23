import { ServerError } from '@via-profit-services/core';
import type { Resolvers } from '@via-profit-services/file-storage';


const updateResolver: Resolvers['FileStorageMutation']['update'] = async (
  parent, args, context,
) => {
  const { info, transform } = args;
  const { dataloader, services } = context;

  await info.reduce(async (prev, fileInfo, index) => {
    await prev;
    const { id, ...otherFileData } = fileInfo;

    const file = await services.files.getFile(id);
    if (!file) {
      throw new ServerError(`File with id ${id} not found`);
    }

    dataloader.files.clear(id);

    try {
      await services.files.updateFile(id, otherFileData);
    } catch (err) {
      throw new ServerError('Failed to update file info', { err, id });
    }

    if (transform && transform[index] && file.type === 'image') {
      try {
        const { resolveAbsolutePath } = services.files.resolveFile(file);
        await services.files.applyTransform(resolveAbsolutePath, transform[index]);
      } catch (err) {
        throw new ServerError('Failed to apply transformations', { err, id });
      }
    }
  }, Promise.resolve());

  return info.map((file) => ({
    id: file.id,
  }));
};

export default updateResolver;
