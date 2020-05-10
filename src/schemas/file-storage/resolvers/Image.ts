import { IResolverObject, IFieldResolver } from 'graphql-tools';

import { Context } from '../../../context';
import createDataloaders from '../loaders';
import { getParams } from '../paramsBuffer';
import FileStorageService from '../service';
import { IFileBag, IImageTransform } from '../types';

interface IParent {
  id: string;
  transform?: IImageTransform;
}

const ImageResolver: IResolverObject<IParent, Context, any> = new Proxy({
  id: () => ({}),
  createdAt: () => ({}),
  updatedAt: () => ({}),
  owner: () => ({}),
  category: () => ({}),
  mimeType: () => ({}),
  url: () => ({}),
  description: () => ({}),
  metaData: () => ({}),
}, {
  get: (target: IFileBag | any, prop: keyof IFileBag) => {
    const resolver: IFieldResolver<IParent, Context, any> = async (parent, args, context) => {
      const { id, transform } = parent;
      const loaders = createDataloaders(context);
      const image = await loaders.files.load(id);

      if (prop === 'url' && transform) {
        const transformHash = Buffer.from(JSON.stringify(transform), 'utf8').toString('base64');
        const ext = FileStorageService.getExtensionByMimeType(image.mimeType);

        const {
          staticPrefix, host, ssl, genericDelimiter,
        } = getParams();

        if (image.isLocalFile) {
          // return `${image.url}/t/${transformHash}`;

          const imageUrlHash = Buffer.from(JSON.stringify({ id: image.id, ext }), 'utf8').toString('base64');
          return `http${ssl ? 's' : ''}://${host}${staticPrefix}/r/${imageUrlHash}/t/${transformHash}.${ext}`;
        }


        const imageUrlHash = Buffer.from(image.url, 'utf8').toString('base64');
        return `http${ssl ? 's' : ''}://${host}${staticPrefix}/${genericDelimiter}/${imageUrlHash}/t/${transformHash}.${ext}`;
      }

      return image[prop];
    };

    return resolver;
  },
});

export default ImageResolver;
