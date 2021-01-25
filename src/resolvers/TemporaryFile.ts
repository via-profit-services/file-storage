import type { TemporaryFileResolver } from '@via-profit-services/file-storage';
// import fs from 'fs';

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
        if (prop === 'url' && transform) {
          return services.files.getUrlWithTransform(file, transform);
        }
      }

      // if (prop === 'size') {
      //   const { resolveAbsolutePath } = services.files.resolveFile(file);

      //   return fs.lstatSync(resolveAbsolutePath).size;
      // }

      return file[prop];
    };

    return resolver;
  },
});

export default temporaryFileResolver;
