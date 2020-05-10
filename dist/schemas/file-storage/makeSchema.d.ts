import { IFileStorageInitialProps } from './types';
export declare const makeSchema: (props: IFileStorageInitialProps) => {
    typeDefs: import("graphql").DocumentNode;
    resolvers: import("graphql-tools").IResolvers<any, import("../../context").Context>;
    permissions: import("graphql-middleware").IMiddlewareGenerator<any, any, any>;
    expressMiddleware: import("@via-profit-services/core").IExpressMidlewareContainer;
};
export default makeSchema;
