import {
  Node, DataLoader, collateForDataloader,
} from '@via-profit-services/core';

import FileStorageService from './service';
import { IFileBag, ITemporaryFileBag, Context } from './types';

interface Loaders {
  files: DataLoader<string, Node<IFileBag>>;
  tremporaryFiles: DataLoader<string, Node<ITemporaryFileBag>>;
}

const loaders: Loaders = {
  files: null,
  tremporaryFiles: null,
};

export default function createLoaders(context: Context) {
  if (loaders.files !== null) {
    return loaders;
  }

  const service = new FileStorageService({ context });

  loaders.files = new DataLoader(async (ids: string[]) => {
    const nodes = await service.getFilesByIds(ids);

    return collateForDataloader(ids, nodes);
  });

  loaders.tremporaryFiles = new DataLoader(async (ids: string[]) => {
    const nodes = await service.getTemporaryFilesByIds(ids);

    return collateForDataloader(ids, nodes);
  });

  return loaders;
}
