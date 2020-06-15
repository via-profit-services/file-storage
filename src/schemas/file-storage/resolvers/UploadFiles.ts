import { IFieldResolver } from 'graphql-tools';

import FileStorageService from '../service';
import {
  IUploadFileInput, ExtendedContext, IFile, IImageTransform,
} from '../types';

interface TArgs {
  files: IFile[];
  info: IUploadFileInput[];
  transform?: IImageTransform[];
  noCompress?: boolean;
}

const UploadFilesResolver: IFieldResolver<any, ExtendedContext, TArgs> = async (
  parent, args, context,
) => {
  const {
    files, info, noCompress, transform,
  } = args;
  const { logger, token } = context;
  const { uuid } = token;

  const fileService = new FileStorageService({ context });
  const filesData = await Promise.all(files);

  const savePromises = filesData.map(async (file, index) => {
    const { createReadStream, mimeType, filename } = file;

    const { id, absoluteFilename } = await fileService.createFile(createReadStream(), {
      mimeType,
      ...info[index],
    }, noCompress);

    logger.fileStorage.info(
      `File «${filename}» uploaded successfully as «${absoluteFilename}»`,
      { uuid, mimeType },
    );


    if (transform && transform[index]) {
      await fileService.applyTransform(absoluteFilename, transform[index]);
    }

    return {
      id,
    };
  });

  return Promise.all(savePromises);
};

export default UploadFilesResolver;
