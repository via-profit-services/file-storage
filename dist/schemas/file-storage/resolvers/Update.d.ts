import { IFieldResolver } from 'graphql-tools';
import { ExtendedContext, IUpdateFileInput } from '../types';
interface TArgs {
    info: IUpdateFileInput[];
}
declare const UpdateResolver: IFieldResolver<any, ExtendedContext, TArgs>;
export default UpdateResolver;
