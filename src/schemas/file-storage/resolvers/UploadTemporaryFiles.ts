import { IFieldResolver } from 'graphql-tools';

import FileStorage from '../service';
import {
  IUploadFileInput, ExtendedContext, IFile, IImageTransform, FileType,
} from '../types';

interface TArgs {
  files: IFile[];
  info: IUploadFileInput[];
  transform?: IImageTransform[];
  noCompress?: boolean;
}

const UploadTemporaryFilesResolver: IFieldResolver<any, ExtendedContext, TArgs> = async (
  parent, args, context,
) => {
  const {
    files, info, noCompress, transform,
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

    const type = FileStorage.getFileTypeByMimeType(fileInfo.mimeType);
    const { id, absoluteFilename } = await fileService.createTemporaryFile(
      stream,
      fileInfo,
    );

    if (transform && transform[index] && type === FileType.image) {
      await fileService.applyTransform(absoluteFilename, transform[index]);
    }

    if (Boolean(noCompress) === false && type === FileType.image) {
      await fileService.compressImage(absoluteFilename);
    }

    logger.fileStorage.info(
      `Temporary file «${filename}» uploaded successfully as «${absoluteFilename}»`,
      { uuid, mimeType, id },
    );

    return {
      id,
    };
  });

  return Promise.all(savePromises);
};

export default UploadTemporaryFilesResolver;
