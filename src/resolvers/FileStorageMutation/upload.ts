import type { IFieldResolver } from '@graphql-tools/utils';
import type { Context } from '@via-profit-services/core';
import type { UploadFileInput, File, ImageTransform, FileBagCreate } from '@via-profit-services/file-storage';

interface UploadFilesArgs {
  files: File[];
  info: UploadFileInput[];
  transform?: ImageTransform[];
  noCompress?: boolean;
}

const uploadResolver: IFieldResolver<any, Context, UploadFilesArgs> = async (
  parent, args, context,
) => {
  const {
    files, info, noCompress, transform,
  } = args;
  const { logger, token, services } = context;
  const { uuid } = token;

  const filesData = await Promise.all(files);

  const savePromises = filesData.map(async (file, index) => {
    const { createReadStream, mimeType, filename } = file;

    const stream = createReadStream();

    const fileInfo: FileBagCreate = {
      mimeType: services.files.resolveMimeType(filename, mimeType),
      isLocalFile: true,
      owner: null,
      description: '',
      metaData: null,
      ...info[index],
    };
    const type = services.files.getFileTypeByMimeType(fileInfo.mimeType);
    const { id, absoluteFilename } = await services.files.createFile(
      stream,
      fileInfo,
    );

    logger.files.info(
      `File «${filename}» uploaded successfully as «${absoluteFilename}»`,
      { uuid, mimeType },
    );


    if (transform && transform[index] && type === 'image') {
      await services.files.applyTransform(absoluteFilename, transform[index]);
    }

    if (Boolean(noCompress) === false && type === 'image') {
      await services.files.compressImage(absoluteFilename);
    }

    return {
      id,
    };
  });

  return Promise.all(savePromises);
};

export default uploadResolver;
