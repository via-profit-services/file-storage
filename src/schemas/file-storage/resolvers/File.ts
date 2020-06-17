import { ServerError } from '@via-profit-services/core';
import { IResolverObject, IFieldResolver } from 'graphql-tools';

import createDataloaders from '../loaders';
import FileStorageService from '../service';
import {
  IFileBag, IImageTransform, FileType, Context,
} from '../types';

interface IParent {
  id: string;
  isTemporary?: boolean;
  transform?: IImageTransform;
}

const FileResolver: IResolverObject<IParent, Context, any> = new Proxy({
  id: () => ({}),
  createdAt: () => ({}),
  updatedAt: () => ({}),
  owner: () => ({}),
  category: () => ({}),
  mimeType: () => ({}),
  url: () => ({}),
  type: () => ({}),
  description: () => ({}),
  metaData: () => ({}),
}, {
  get: (target: IFileBag | any, prop: keyof IFileBag) => {
    const resolver: IFieldResolver<IParent, Context, any> = async (parent, args, context) => {
      const { id, transform, isTemporary } = parent;
      const fileStorage = new FileStorageService({ context });

      let file: IFileBag | false;
      if (isTemporary) {
        file = await fileStorage.getTemporaryFile(id);
      } else {
        const loaders = createDataloaders(context);
        file = await loaders.files.load(id);
      }

      if (!file) {
        throw new ServerError(
          `File with id ${id} not found`, { id },
        );
      }
      // if is image
      if (file.type === FileType.image) {
        if (prop === 'url' && transform) {
          return fileStorage.getUrlWithTransform(file, transform);
        }
      }

      return file[prop];
    };

    return resolver;
  },
});

export default FileResolver;
