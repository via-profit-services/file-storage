import { IExpressMidlewareContainer } from '@via-profit-services/core';
import { IFileStorageInitialProps } from './types';
declare type MiddlewareFactory = (props: IFileStorageInitialProps) => IExpressMidlewareContainer;
declare const expressMiddlewareFactory: MiddlewareFactory;
export default expressMiddlewareFactory;
