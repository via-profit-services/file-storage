import { IObjectTypeResolver } from '@via-profit-services/core';
import { IImageTransform, Context } from '../types';
interface IParent {
    id: string;
    transform?: IImageTransform;
}
declare const FileResolver: IObjectTypeResolver<IParent, Context, any>;
export default FileResolver;
