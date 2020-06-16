import { IResolverObject } from 'graphql-tools';
import { Context } from '../types';
interface IParent {
    id: string;
}
declare const TemporaryFileResolver: IResolverObject<IParent, Context, any>;
export default TemporaryFileResolver;
