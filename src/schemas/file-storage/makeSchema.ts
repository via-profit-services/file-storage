import { IExpressMidlewareContainer } from '@via-profit-services/core';

import expressMiddlewareFactory from './expressMiddleware';
import { setParams, getParams } from './paramsBuffer';
import resolvers from './resolvers';
import * as typeDefs from './schema.graphql';
import { FileStorageInitialProps } from './types';

type MakeSchema = (props?: FileStorageInitialProps) => {
  typeDefs: typeof typeDefs;
  resolvers: typeof resolvers;
  expressMiddleware: IExpressMidlewareContainer;
}

export const makeSchema: MakeSchema = (props) => {
  setParams(props);

  const expressMiddleware = expressMiddlewareFactory(getParams());

   return {
    typeDefs,
    resolvers,
    expressMiddleware,
  }
}

export default makeSchema;
