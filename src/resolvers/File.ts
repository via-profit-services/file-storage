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
  get: (target, prop: keyof FileResolver) => {
    const resolver: FileResolver[keyof FileResolver] = async (parent, args, context) => {
      const { id } = parent;
      const { dataloader, services } = context;

      const file = await dataloader.files.load(id);

      if (!file) {
        return null;
      }


      // if is image
      if (prop === 'transform' && args.options) {

        // console.log({args, parent })
        const transformedURL = await services.files.getUrlWithTransform(file, args.options);
        const transformedID = transformedURL.split('/').reverse()[0].replace(/\..*$/, '');

        return {
          originalFile: file,
          originalID: id,
          transformedID,
          transformedURL,
          transform: args,
        };
        // if (prop === 'id' && transform) {
        //   const fakeID = Buffer.from(JSON.stringify({ id, transform })).toString('base64');

        //   return `fakeID:${fakeID}`;
        // }

        // if (prop === 'url' && transform) {
        //   const url = await services.files.getUrlWithTransform(file, transform);

        //   return url;
        // }
      }


      return (file as any)[prop];
    };

    return resolver;
  },
});

export default fileResolver;
