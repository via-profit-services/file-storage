import { ServerError } from '@via-profit-services/core';
import type { Resolvers } from '@via-profit-services/file-storage';


const clearCache: Resolvers['FileStorageMutation']['clearCache'] = async (
  _parent, _args, context,
) => {
  const { services, dataloader } = context;

  await dataloader.files.clearAll();

  try {
    await services.files.clearCache();
  } catch (err) {
    throw new ServerError('File Storage. Failed to clear cache', { err });
  }

  return null;
}

export default clearCache;
