import type { FileResolver } from '@via-profit-services/file-storage';
// import fs from 'fs';

const fileResolver = new Proxy<FileResolver>({
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
  get: (target, prop: keyof FileResolver) => {
    const resolver: FileResolver[keyof FileResolver] = async (parent, args, context) => {
      const { id, transform } = parent;
      const { dataloader, services } = context;

      const file = await dataloader.files.load(id);

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

export default fileResolver;
