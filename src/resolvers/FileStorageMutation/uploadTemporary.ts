import type { Resolvers } from '@via-profit-services/file-storage';

const uploadTemporaryResolver: Resolvers['FileStorageMutation']['uploadTemporary'] = async (
  _parent, args, context,
) => {
  const { files, info } = args;
  const { logger, services } = context;

  const filesData = await Promise.all(files);
  const savePromises = filesData.map(async (file, index) => {
    const { createReadStream, mimeType, filename } = file;

    const stream = createReadStream();
    const fileInfo = {
      mimeType: services.files.resolveMimeType(filename, mimeType),
      isLocalFile: true,
      ...info[index],
    };

    const { id, absoluteFilename } = await services.files.createTemporaryFile(
      stream,
      fileInfo,
    );

    logger.files.info(
      `Temporary file «${filename}» uploaded successfully as «${absoluteFilename}»`,
      { mimeType, id },
    );

    return {
      id,
    };
  });

  return Promise.all(savePromises);
};

export default uploadTemporaryResolver;
