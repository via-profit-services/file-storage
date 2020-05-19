import { IFieldResolver } from 'graphql-tools';
import { IUploadFileInput, ExtendedContext, IFile } from '../types';
interface TArgs {
    files: IFile[];
    info: IUploadFileInput[];
    noCompress?: boolean;
}
declare const UploadFilesResolver: IFieldResolver<any, ExtendedContext, TArgs>;
export default UploadFilesResolver;
