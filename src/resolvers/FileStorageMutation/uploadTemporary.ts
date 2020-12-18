import type { IFieldResolver } from '@graphql-tools/utils';
import type { Context } from '@via-profit-services/core';
import type { UploadFileInput, File, ImageTransform } from '@via-profit-services/file-storage';

interface UploadTemporaryFilesArgs {
  files: File[];
  info: UploadFileInput[];
  transform?: ImageTransform[];
  noCompress?: boolean;
}

const uploadTemporaryResolver: IFieldResolver<any, Context, UploadTemporaryFilesArgs> = async (
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
    const fileInfo = {
      mimeType: services.files.resolveMimeType(filename, mimeType),
      isLocalFile: true,
      ...info[index],
    };

    const type = services.files.getFileTypeByMimeType(fileInfo.mimeType);
    const { id, absoluteFilename } = await services.files.createTemporaryFile(
      stream,
      fileInfo,
    );
    if (transform && transform[index] && type === 'image') {
      await services.files.applyTransform(absoluteFilename, transform[index]);
    }

    if (Boolean(noCompress) === false && type === 'image') {
      await services.files.compressImage(absoluteFilename);
    }

    logger.files.info(
      `Temporary file «${filename}» uploaded successfully as «${absoluteFilename}»`,
      { uuid, mimeType, id },
    );

    return {
      id,
    };
  });

  return Promise.all(savePromises);
};

export default uploadTemporaryResolver;
