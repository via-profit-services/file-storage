import { ServerError } from '@via-profit-services/core';
import { IFieldResolver } from 'graphql-tools';

import { FileStorage } from '..';
import createLoaders from '../loaders';
import FileStorageService from '../service';
import {
  ExtendedContext, IUpdateFileInput, IImageTransform, FileType,
} from '../types';

interface TArgs {
  info: IUpdateFileInput[];
  transform?: IImageTransform[];
}

const UpdateResolver: IFieldResolver<any, ExtendedContext, TArgs> = async (
  parent, args, context,
) => {
  const { info, transform } = args;
  const fileService = new FileStorageService({ context });
  const loaders = createLoaders(context);

  await info.reduce(async (prev, fileInfo, index) => {
    await prev;
    const { id, ...otherFileData } = fileInfo;

    const file = await fileService.getFile(id);
    if (!file) {
      throw new ServerError(`File with id ${id} not found`);
    }

    loaders.files.clear(id);

    try {
      await fileService.updateFile(id, otherFileData);
    } catch (err) {
      throw new ServerError('Failed to update file info', { err, id });
    }

    if (transform && transform[index] && file.type === FileType.image) {
      try {
        const { resolveAbsolutePath } = FileStorage.resolveFile(file);
        await fileService.applyTransform(resolveAbsolutePath, transform[index]);
      } catch (err) {
        throw new ServerError('Failed to apply transformations', { err, id });
      }
    }
  }, Promise.resolve());

  return info.map((file) => ({
    id: file.id,
  }));
};

export default UpdateResolver;
