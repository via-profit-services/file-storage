import { ServerError, IFile } from '@via-profit-services/core';
import { IFieldResolver } from 'graphql-tools';

import { Context } from '../../../context';
import FileStorageService from '../service';
import { IUploadFileInput } from '../types';

interface TArgs {
  file: IFile;
  info: IUploadFileInput;
}

const UploadFilesResolver: IFieldResolver<any, Context, TArgs> = async (
  parent, args, context,
) => {
  const { file, info } = args;
  const { logger, token } = context;
  const { uuid } = token;
  const { createReadStream, filename } = await file;

  const fileService = new FileStorageService({ context });

  // get mimeType from file ext, bun mimeType from OS is not correct
  const mimeType = FileStorageService.getMimeTypeByFilename(filename);

  try {
    const createdFile = await fileService.createFile(createReadStream(), {
      mimeType,
      ...info,
    });

    logger.fileStorage.info(`File uploaded successfully in [${createdFile.absoluteFilename}]`, { uuid, mimeType });
    return {
      id: createdFile.id,
      url: '/test/',
    };
  } catch (err) {
    logger.fileStorage.error('Failed to Upload files', { err, uuid });
    throw new ServerError('Failed to Upload files', { err, uuid });
  }
};

export default UploadFilesResolver;
