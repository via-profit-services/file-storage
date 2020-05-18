import { IFieldResolver } from 'graphql-tools';

import FileStorageService from '../service';
import { IUploadFileInput, ExtendedContext, IFile } from '../types';

interface TArgs {
  files: IFile[];
  info: IUploadFileInput[];
  noCompress?: boolean;
}

const UploadFilesResolver: IFieldResolver<any, ExtendedContext, TArgs> = async (
  parent, args, context,
) => {
  const { files, info, noCompress } = args;
  const { logger, token } = context;
  const { uuid } = token;

  const fileService = new FileStorageService({ context });


  const filesData = await Promise.all(files);

  const savePromises = filesData.map(async (file, index) => {
    const { createReadStream, mimeType, filename } = file;

    const createdFile = await fileService.createFile(createReadStream(), {
      mimeType,
      ...info[index],
    }, noCompress);

    logger.fileStorage.info(
      `File «${filename}» uploaded successfully as «${createdFile.absoluteFilename}»`,
      { uuid, mimeType },
    );

    return {
      id: createdFile.id,
    };
  });

  return Promise.all(savePromises);
};

export default UploadFilesResolver;
