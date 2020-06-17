import { IFieldResolver } from 'graphql-tools';

import FileStorage from '../service';
import {
  IUploadFileInput, ExtendedContext, IFile,
} from '../types';

interface TArgs {
  files: IFile[];
  info: IUploadFileInput[];
}

const UploadTemporaryFilesResolver: IFieldResolver<any, ExtendedContext, TArgs> = async (
  parent, args, context,
) => {
  const {
    files, info,
  } = args;
  const { logger, token } = context;
  const { uuid } = token;

  const fileService = new FileStorage({ context });
  const filesData = await Promise.all(files);

  const savePromises = filesData.map(async (file, index) => {
    const { createReadStream, mimeType, filename } = file;

    const stream = createReadStream();
    const fileInfo = {
      mimeType: FileStorage.resolveMimeType(filename, mimeType),
      isLocalFile: true,
      ...info[index],
    };

    const { id, absoluteFilename } = await fileService.createTemporaryFile(
      stream,
      fileInfo,
    );

    logger.fileStorage.info(
      `Temporary file «${filename}» uploaded successfully as «${absoluteFilename}»`,
      { uuid, mimeType },
    );

    return {
      id,
      isTemporary: true,
    };
  });

  return Promise.all(savePromises);
};

export default UploadTemporaryFilesResolver;
