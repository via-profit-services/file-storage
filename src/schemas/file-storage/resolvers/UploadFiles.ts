import { IFieldResolver } from 'graphql-tools';

import FileStorage from '../service';
import {
  IUploadFileInput, ExtendedContext, IFile, IImageTransform, IFileBagCreate, FileType,
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

  const fileService = new FileStorage({ context });
  const filesData = await Promise.all(files);

  const savePromises = filesData.map(async (file, index) => {
    const { createReadStream, mimeType, filename } = file;

    const stream = createReadStream();
    const options = {
      noCompress: Boolean(noCompress || (transform && transform[index])),
    };
    const fileInfo: IFileBagCreate = {
      mimeType: FileStorage.resolveMimeType(filename, mimeType),
      isLocalFile: true,
      owner: null,
      description: '',
      metaData: null,
      ...info[index],
    };
    const type = FileStorage.getFileTypeByMimeType(fileInfo.mimeType);
    const { id, absoluteFilename } = await fileService.createFile(
      stream,
      fileInfo,
      options,
    );

    logger.fileStorage.info(
      `File «${filename}» uploaded successfully as «${absoluteFilename}»`,
      { uuid, mimeType },
    );


    if (transform && transform[index] && type === FileType.image) {
      await fileService.applyTransform(absoluteFilename, transform[index]);
    }

    return {
      id,
    };
  });

  return Promise.all(savePromises);
};

export default UploadFilesResolver;
