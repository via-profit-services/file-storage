import {
  Node, DataLoader, collateForDataloader,
} from '@via-profit-services/core';

import { Context } from '../../context';
import FileStorageService from './service';
import { IFileBag } from './types';

interface Loaders {
  files: DataLoader<string, Node<IFileBag>>;
}

const loaders: Loaders = {
  files: null,
};

export default function createLoaders(context: Context) {
  if (loaders.files !== null) {
    return loaders;
  }

  const service = new FileStorageService({ context });

  loaders.files = new DataLoader<string, Node<IFileBag>>((ids: string[]) => {
    return service.getFilesByIds(ids)
      .then((nodes) => collateForDataloader(ids, nodes));
  });

  return loaders;
}
