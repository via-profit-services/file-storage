import { IFieldResolver } from 'graphql-tools';
import { ExtendedContext, IUpdateFileInput } from '../types';
interface TArgs {
    ids: string[];
    info: IUpdateFileInput[];
}
declare const ApplyTemporaryResolver: IFieldResolver<any, ExtendedContext, TArgs>;
export default ApplyTemporaryResolver;
