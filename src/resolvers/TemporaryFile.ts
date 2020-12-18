import type { IObjectTypeResolver, IFieldResolver } from '@graphql-tools/utils';
import type { Context } from '@via-profit-services/core';
import type { FileBag, ImageTransform } from '@via-profit-services/file-storage';

interface IParent {
  id: string;
  transform?: ImageTransform;
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
  get: (target: FileBag | any, prop: keyof FileBag) => {
    const resolver: IFieldResolver<IParent, Context, any> = async (parent, args, context) => {
      const { id, transform } = parent;
      const { dataloader, services } = context;

      const file = await dataloader.tremporaryFiles.load(id);

      if (!file) {
        return null;
      }

      // if is image
      if (file.type === 'image') {
        if (prop === 'url' && transform) {
          return services.files.getUrlWithTransform(file, transform);
        }
      }

      return file[prop];
    };

    return resolver;
  },
});

export default TemporaryFileResolver;
