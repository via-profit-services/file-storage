import type { Resolvers, FileBagCreate } from '@via-profit-services/file-storage';

const uploadResolver: Resolvers['FileStorageMutation']['upload'] = async (
  _parent, args, context,
) => {
  const { files, info } = args;
  const { logger, services } = context;

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

    const { id, absoluteFilename } = await services.files.createFile(
      stream,
      fileInfo,
    );

    logger.files.info(
      `File «${filename}» uploaded successfully as «${absoluteFilename}»`,
      { mimeType },
    );

    return {
      id,
    };
  });

  return Promise.all(savePromises);
};

export default uploadResolver;
