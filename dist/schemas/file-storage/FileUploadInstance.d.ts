import { IFilePayload } from './types';
declare class FileUploadInstance {
    promise: Promise<any>;
    resolve: (file: IFilePayload) => void;
    file: IFilePayload;
    reject: any;
    constructor();
}
export default FileUploadInstance;
