/// <reference types="qs" />
/// <reference types="express" />
import { Express } from '@via-profit-services/core';
import { IUploadExpressMiddlewareProps } from './types';
declare const graphqlUploadExpress: (props: IUploadExpressMiddlewareProps) => (request: Express.Request<import("express-serve-static-core").ParamsDictionary, any, any, import("qs").ParsedQs>, response: any, next: Express.NextFunction) => Promise<void>;
export default graphqlUploadExpress;
