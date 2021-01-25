import { ServerError } from '@via-profit-services/core';
import type { Resolvers } from '@via-profit-services/file-storage';


const applyTemporary: Resolvers['FileStorageMutation']['applyTemporary'] = async (
  _parent, args, context,
) => {
  const { ids, info } = args;
  const { services } = context;

  await ids.reduce(async (prev, id, index) => {
    await prev;
    try {
      await services.files.moveFileFromTemporary(id);
    } catch (err) {
      throw new ServerError('Failed to move uploaded file', { err, id });
    }

    if (info && info[index]) {
      try {
        await services.files.updateFile(id, info[index]);
      } catch (err) {
        throw new ServerError('Failed to update file info', { err, id });
      }
    }
  }, Promise.resolve());

  return ids.map((id) => ({ id }));
};

export default applyTemporary;
