import { ServerError } from '@via-profit-services/core';
import { IFieldResolver } from 'graphql-tools';

import FileStorageService from '../service';
import { ExtendedContext, IUpdateFileInput } from '../types';

interface TArgs {
  info: IUpdateFileInput[];
}

const UpdateResolver: IFieldResolver<any, ExtendedContext, TArgs> = async (
  parent, args, context,
) => {
  const { info } = args;
  const fileService = new FileStorageService({ context });

  await info.reduce(async (prev, fileInfo) => {
    await prev;
    const { id, ...otherFileData } = fileInfo;
    try {
      await fileService.updateFile(id, otherFileData);
    } catch (err) {
      throw new ServerError('Failed to update file info', { err, id });
    }
  }, Promise.resolve());

  return info.map((file) => ({
    id: file.id,
  }));
};

export default UpdateResolver;
