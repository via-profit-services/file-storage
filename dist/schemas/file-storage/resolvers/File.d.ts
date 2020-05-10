import { IResolverObject } from 'graphql-tools';
import { Context } from '../../../context';
interface IParent {
    id: string;
}
declare const FileResolver: IResolverObject<IParent, Context, any>;
export default FileResolver;
