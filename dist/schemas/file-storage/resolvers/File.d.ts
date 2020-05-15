import { IResolverObject } from 'graphql-tools';
import { Context } from '../../../context';
import { IImageTransform } from '../types';
interface IParent {
    id: string;
    transform?: IImageTransform;
}
declare const FileResolver: IResolverObject<IParent, Context, any>;
export default FileResolver;
