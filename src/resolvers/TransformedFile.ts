import type { TransformedFileResolver, TransformUrlPayload } from '@via-profit-services/file-storage';
import crypto from 'crypto';


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
  reference: () => ({}),
}, {
  get: (target, prop: keyof TransformedFileResolver) => {
    const resolver: TransformedFileResolver[keyof TransformedFileResolver] = async (
      parent, args, context,
    ) => {


      const { reference, transform } = parent;
      const ext = context.services.files.getExtensionByMimeType(reference.mimeType);
      const transformUrlPayload: TransformUrlPayload = {
        ext,
        id: reference.id,
        transform,
      };
      const transformedID = crypto.createHash('md5').update(JSON.stringify(transformUrlPayload)).digest('hex');

      const url = context.services.files.transformPayloadToUrl(transformUrlPayload);
      const file = {
        ...reference,
        url,
        id: transformedID,
        reference: {
          id: reference.id,
        },
      };


      return file[prop];

    };

    return resolver;
  },
});

export default fileResolver;
