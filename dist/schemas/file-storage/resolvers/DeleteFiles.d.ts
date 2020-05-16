import { IFieldResolver } from 'graphql-tools';
import { Context } from '../types';
interface TArgs {
    ids: string[];
}
declare const DeleteFilesResolver: IFieldResolver<any, Context, TArgs>;
export default DeleteFilesResolver;
