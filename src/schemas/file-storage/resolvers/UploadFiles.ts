import { ServerError, IFile } from '@via-profit-services/core';
import { IFieldResolver } from 'graphql-tools';

import { Context } from '../../../context';
import FileStorageService from '../service';
import { IUploadFileInput } from '../types';

interface TArgs {
  files: IFile[];
  info: IUploadFileInput[];
  noCompress?: boolean;
}

const UploadFilesResolver: IFieldResolver<any, Context, TArgs> = async (
  parent, args, context,
) => {
  const { files, info, noCompress } = args;
  const { logger, token } = context;
  const { uuid } = token;

  const fileService = new FileStorageService({ context });


  const returnDataArray: any[] = [];
  await files.reduce(async (previousPromise, currentFile, index) => {
    await previousPromise;
    const { createReadStream, filename } = await currentFile;
    const mimeType = FileStorageService.getMimeTypeByFilename(filename);

    try {
      const createdFile = await fileService.createFile(createReadStream(), {
        mimeType,
        ...info[index],
      }, noCompress);

      logger.fileStorage.info(
        `File uploaded successfully in [${createdFile.absoluteFilename}]`, { uuid, mimeType },
      );
      returnDataArray[index] = { id: createdFile.id };
    } catch (err) {
      logger.fileStorage.error('Failed to Upload files', { err, uuid });
      throw new ServerError('Failed to Upload files', { err, uuid });
    }
  }, Promise.resolve());


  return returnDataArray;
};

export default UploadFilesResolver;
