import { IFieldResolver } from 'graphql-tools';
import { ExtendedContext } from '../types';
interface TArgs {
    ids?: string[];
    owners?: string[];
}
declare const DeleteFilesResolver: IFieldResolver<any, ExtendedContext, TArgs>;
export default DeleteFilesResolver;
