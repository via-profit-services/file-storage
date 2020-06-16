import { ServerError } from '@via-profit-services/core';
import { IFieldResolver } from 'graphql-tools';

import FileStorageService from '../service';
import { ExtendedContext, IUpdateFileInput } from '../types';

interface TArgs {
  ids: string[];
  info: IUpdateFileInput[];
}

const ApplyTemporaryResolver: IFieldResolver<any, ExtendedContext, TArgs> = async (
  parent, args, context,
) => {
  const { ids, info } = args;
  const fileService = new FileStorageService({ context });

  await ids.reduce(async (prev, id, index) => {
    await prev;
    try {
      await fileService.moveFileFromTemporary(id);
    } catch (err) {
      throw new ServerError('Failed to move uploaded file', { err, id });
    }

    if (info && info[index]) {
      try {
        await fileService.updateFile(id, info[index]);
      } catch (err) {
        throw new ServerError('Failed to update file info', { err, id });
      }
    }
  }, Promise.resolve());

  return ids.map((id) => ({ id }));
};

export default ApplyTemporaryResolver;
