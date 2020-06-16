import { IFieldResolver } from 'graphql-tools';
import { IUploadFileInput, ExtendedContext, IFile } from '../types';
interface TArgs {
    files: IFile[];
    info: IUploadFileInput[];
}
declare const UploadTemporaryFilesResolver: IFieldResolver<any, ExtendedContext, TArgs>;
export default UploadTemporaryFilesResolver;
