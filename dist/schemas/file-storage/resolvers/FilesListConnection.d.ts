import { TInputFilter } from '@via-profit-services/core';
import { IFieldResolver } from 'graphql-tools';
import { Context } from '../../../context';
import { IImageTransform } from '../types';
declare const FilesListConnectionResolver: IFieldResolver<any, Context, TArgs>;
declare type TArgs = TInputFilter & {
    transform?: IImageTransform;
};
export default FilesListConnectionResolver;
