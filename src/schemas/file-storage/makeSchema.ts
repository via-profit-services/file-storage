import expressMiddlewareFactory from './expressMiddleware';
import { setParams } from './paramsBuffer';
import permissions from './permissions';
import resolvers from './resolvers';
import * as typeDefs from './schema.graphql';
import { IFileStorageInitialProps } from './types';

export const makeSchema = (props: IFileStorageInitialProps) => {
  setParams(props);

  const expressMiddleware = expressMiddlewareFactory(props);
  return {
    typeDefs,
    resolvers,
    permissions,
    expressMiddleware,
  };
};

export default makeSchema;
