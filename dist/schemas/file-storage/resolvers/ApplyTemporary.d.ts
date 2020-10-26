import { IFieldResolver } from '@via-profit-services/core';
import { ExtendedContext, IUpdateFileInput } from '../types';
interface TArgs {
    ids: string[];
    info: IUpdateFileInput[];
}
declare const ApplyTemporaryResolver: IFieldResolver<any, ExtendedContext, TArgs>;
export default ApplyTemporaryResolver;
