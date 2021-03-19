import type { TransformedFileResolver } from '@via-profit-services/file-storage';


const fileResolver = new Proxy<TransformedFileResolver>({
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
  referense: () => ({}),
}, {
  get: (target, prop: keyof TransformedFileResolver) => {
    const resolver: TransformedFileResolver[keyof TransformedFileResolver] = async (parent, args, context) => {
      const { id, originalFile, transformedURL, transformedID, originalID } = parent;

      const file = originalFile;
      
      if (prop === 'url') {

        return transformedURL
      }

      if (prop === 'id') {
        return transformedID;
      }
      if (prop === 'referense') {
        return originalFile;
      }


      return (file as any)[prop];
    };

    return resolver;
  },
});

export default fileResolver;
