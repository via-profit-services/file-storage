import { IResolverObject } from 'graphql-tools';
import { IImageTransform, Context } from '../types';
interface IParent {
    id: string;
    transform?: IImageTransform;
}
declare const FileResolver: IResolverObject<IParent, Context, any>;
export default FileResolver;
