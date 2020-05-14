import { IResolverObject, IFieldResolver } from 'graphql-tools';

import { Context } from '../../../context';
import createDataloaders from '../loaders';
import FileStorageService from '../service';
import { IFileBag, IImageTransform, FileType } from '../types';

interface IParent {
  id: string;
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
  description: () => ({}),
  metaData: () => ({}),
}, {
  get: (target: IFileBag | any, prop: keyof IFileBag) => {
    const resolver: IFieldResolver<IParent, Context, any> = async (parent, args, context) => {
      const { id, transform } = parent;
      const fileStorage = new FileStorageService({ context });

      const loaders = createDataloaders(context);
      const file = await loaders.files.load(id);

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
