import type { FileResolver } from '@via-profit-services/file-storage';

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
        if (prop === 'id' && transform) {
          const fakeID = Buffer.from(JSON.stringify({ id, transform })).toString('base64');

          return `fakeID:${fakeID}`;
        }

        if (prop === 'url' && transform) {
          const url = await services.files.getUrlWithTransform(file, transform);

          return url;
        }
      }


      return file[prop];
    };

    return resolver;
  },
});

export default fileResolver;
