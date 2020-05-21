import expressMiddlewareFactory from './expressMiddleware';
import { setParams, getParams } from './paramsBuffer';
import resolvers from './resolvers';
import * as typeDefs from './schema.graphql';
import { IFileStorageInitialProps } from './types';

export const makeSchema = (props?: IFileStorageInitialProps) => {
  setParams(props);

  const expressMiddleware = expressMiddlewareFactory(getParams());
  return {
    typeDefs,
    resolvers,
    expressMiddleware,
  };
};

export default makeSchema;
