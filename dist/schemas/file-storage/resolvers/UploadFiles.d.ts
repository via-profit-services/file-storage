import { IFieldResolver } from 'graphql-tools';
import { IUploadFileInput, ExtendedContext, IFile, IImageTransform } from '../types';
interface TArgs {
    files: IFile[];
    info: IUploadFileInput[];
    transform?: IImageTransform[];
    noCompress?: boolean;
}
declare const UploadFilesResolver: IFieldResolver<any, ExtendedContext, TArgs>;
export default UploadFilesResolver;
