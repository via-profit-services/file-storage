import { IExpressMidlewareContainer } from '@via-profit-services/core';
import { IFileStorageInitialProps } from './types';
declare const expressMiddlewareFactory: (props: IFileStorageInitialProps) => IExpressMidlewareContainer;
export default expressMiddlewareFactory;
