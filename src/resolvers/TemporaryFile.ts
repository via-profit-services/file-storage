import type { TemporaryFileResolver } from '@via-profit-services/file-storage';

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
  get: (_target, prop: keyof TemporaryFileResolver) => {
    const resolver: TemporaryFileResolver[keyof TemporaryFileResolver] = async (
      parent,
      args,
      context,
    ) => {
      const { id } = parent;
      const { dataloader } = context;

      const file = await dataloader.tremporaryFiles.load(id);

      if (!file) {
        return null;
      }

      // if is image
      return file[prop];
    };

    return resolver;
  },
});

export default temporaryFileResolver;
