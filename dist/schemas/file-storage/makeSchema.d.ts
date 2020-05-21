import { IFileStorageInitialProps } from './types';
export declare const makeSchema: (props?: IFileStorageInitialProps) => {
    typeDefs: import("graphql").DocumentNode;
    resolvers: import("graphql-tools").IResolvers<any, import("./types").ExtendedContext>;
    expressMiddleware: import("@via-profit-services/core").IExpressMidlewareContainer;
};
export default makeSchema;
