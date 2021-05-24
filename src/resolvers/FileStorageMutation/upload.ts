import { BadRequestError } from '@via-profit-services/core';
import type { Resolvers, FileBagCreate } from '@via-profit-services/file-storage';

const uploadResolver: Resolvers['FileStorageMutation']['upload'] = async (
  _parent, args, context,
) => {
  const { files, info } = args;
  const { logger, services, dataloader } = context;

  // check to exists
  // new IDs
  const ids = info.reduce((list, data) => data.id ? list.concat([data.id]) : list, []);
  // try to load
  const existFiles = await Promise.all(ids.map((id) => dataloader.files.load(id)));

  //check result
  const hasFiles = existFiles.filter((data) => data !== null);

  if (hasFiles.length) {
    throw new BadRequestError(
      `One or more files that you are trying to upload already exists. Check this IDs: [${hasFiles.map(({ id }) => id).join(', ')}].`,
    );
  }

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

    await dataloader.files.clear(id);

    return {
      id,
    };
  });

  return Promise.all(savePromises);
};

export default uploadResolver;
