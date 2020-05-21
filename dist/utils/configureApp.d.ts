import { IInitProps } from '@via-profit-services/core';
declare const configureApp: (props?: IProps) => IInitProps;
interface IProps {
    typeDefs: IInitProps['typeDefs'];
    resolvers: IInitProps['resolvers'];
    expressMiddlewares: IInitProps['expressMiddlewares'];
}
export default configureApp;
export { configureApp };
