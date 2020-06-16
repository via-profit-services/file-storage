import { ServerError } from '@via-profit-services/core';
import { IResolverObject, IFieldResolver } from 'graphql-tools';

import FileStorageService from '../service';
import {
  ITemporaryFileBag, Context,
} from '../types';

interface IParent {
  id: string;
}

const TemporaryFileResolver: IResolverObject<IParent, Context, any> = new Proxy({
  id: () => ({}),
  url: () => ({}),
  owner: () => ({}),
  category: () => ({}),
  mimeType: () => ({}),
  type: () => ({}),
  description: () => ({}),
  metaData: () => ({}),
}, {
  get: (target: ITemporaryFileBag | any, prop: keyof ITemporaryFileBag) => {
    const resolver: IFieldResolver<IParent, Context, any> = async (parent, args, context) => {
      const { id } = parent;
      const fileStorage = new FileStorageService({ context });
      const file = await fileStorage.getTemporaryFile(id);

      if (!file) {
        throw new ServerError(
          `Temporary File with id ${id} not found`, { id },
        );
      }
      return file[prop];
    };

    return resolver;
  },
});

export default TemporaryFileResolver;
