import { IFieldResolver } from 'graphql-tools';
import { IUploadFileInput, Context, IFile } from '../types';
interface TArgs {
    files: IFile[];
    info: IUploadFileInput[];
    noCompress?: boolean;
}
declare const UploadFilesResolver: IFieldResolver<any, Context, TArgs>;
export default UploadFilesResolver;
