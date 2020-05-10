import { IResolverObject, IFieldResolver } from 'graphql-tools';

import { Context } from '../../../context';
import createDataloaders from '../loaders';
import { IFileBag } from '../types';

interface IParent {
  id: string;
}

const FileResolver: IResolverObject<IParent, Context, any> = new Proxy({
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
      const { id } = parent;
      const loaders = createDataloaders(context);
      const data = await loaders.files.load(id);

      return data[prop];
    };

    return resolver;
  },
});

export default FileResolver;
