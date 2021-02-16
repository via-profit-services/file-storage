import type { TemporaryFileResolver } from '@via-profit-services/file-storage';
import path from 'path';

const temporaryFileResolver = new Proxy<TemporaryFileResolver>({
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
  get: (target, prop: keyof TemporaryFileResolver) => {
    const resolver: TemporaryFileResolver[keyof TemporaryFileResolver] = async (
      parent,
      args,
      context,
    ) => {
      const { id, transform } = parent;
      const { dataloader, services } = context;

      const file = await dataloader.tremporaryFiles.load(id);

      if (!file) {
        return null;
      }

      // if is image
      if (file.type === 'image') {

        if (prop === 'id' && transform) {
          const url = await services.files.getUrlWithTransform(file, transform);
          const cahcedID = path.basename(url).split('.')[0];

          return `transform.${cahcedID}`;
        }

        if (prop === 'url' && transform) {
          return services.files.getUrlWithTransform(file, transform);
        }
      }

      return file[prop];
    };

    return resolver;
  },
});

export default temporaryFileResolver;
