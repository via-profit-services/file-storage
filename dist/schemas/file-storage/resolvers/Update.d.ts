import { IFieldResolver } from 'graphql-tools';
import { ExtendedContext, IUpdateFileInput, IImageTransform } from '../types';
interface TArgs {
    info: IUpdateFileInput[];
    transform?: IImageTransform[];
}
declare const UpdateResolver: IFieldResolver<any, ExtendedContext, TArgs>;
export default UpdateResolver;
