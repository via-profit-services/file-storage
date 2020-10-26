import { TInputFilter, IFieldResolver } from '@via-profit-services/core';
import { IImageTransform, ExtendedContext } from '../types';
declare const FilesListConnectionResolver: IFieldResolver<any, ExtendedContext, TArgs>;
declare type TArgs = TInputFilter & {
    transform?: IImageTransform;
};
export default FilesListConnectionResolver;
