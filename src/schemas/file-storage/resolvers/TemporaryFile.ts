import { IObjectTypeResolver, IFieldResolver } from '@via-profit-services/core';

import createDataloaders from '../loaders';
import FileStorageService from '../service';
import {
  IFileBag, IImageTransform, FileType, Context,
} from '../types';

interface IParent {
  id: string;
  transform?: IImageTransform;
}

const TemporaryFileResolver: IObjectTypeResolver<IParent, Context, any> = new Proxy({
  id: () => ({}),
  createdAt: () => ({}),
  updatedAt: () => ({}),
  expiredAt: () => ({}),
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
      const { id, transform } = parent;
      const fileStorage = new FileStorageService({ context });

      const loaders = createDataloaders(context);
      const file = await loaders.tremporaryFiles.load(id);

      if (!file) {
        return null;
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

export default TemporaryFileResolver;
