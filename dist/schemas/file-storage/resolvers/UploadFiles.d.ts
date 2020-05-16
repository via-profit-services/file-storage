import { IFile } from '@via-profit-services/core';
import { IFieldResolver } from 'graphql-tools';
import { Context } from '../../../context';
import { IUploadFileInput } from '../types';
interface TArgs {
    files: IFile[];
    info: IUploadFileInput[];
    noCompress?: boolean;
}
declare const UploadFilesResolver: IFieldResolver<any, Context, TArgs>;
export default UploadFilesResolver;
