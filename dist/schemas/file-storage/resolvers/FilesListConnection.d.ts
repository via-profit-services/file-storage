import { TInputFilter } from '@via-profit-services/core';
import { IFieldResolver } from 'graphql-tools';
import { IImageTransform, Context } from '../types';
declare const FilesListConnectionResolver: IFieldResolver<any, Context, TArgs>;
declare type TArgs = TInputFilter & {
    transform?: IImageTransform;
};
export default FilesListConnectionResolver;
