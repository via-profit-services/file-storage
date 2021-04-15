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
  transform: () => ({}),
}, {
  get: (_target, prop: keyof FileResolver) => {
    const resolver: FileResolver[keyof FileResolver] = async (parent, args, context) => {
      const { id } = parent;
      const { dataloader } = context;

      const file = await dataloader.files.load(id);

      if (!file) {
        return null;
      }

      if (prop === 'transform') {
        return {
          reference: file,
          transform: {
            ...args,
            ...parent.transform,
          },
        }
      }

      return file[prop];
    };

    return resolver;
  },
});

export default fileResolver;
