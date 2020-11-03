import { IFilePayload } from './types';

class FileUploadInstance {
  public promise: Promise<any>;

  public resolve: (file: IFilePayload) => void;

  public file: IFilePayload;

  public reject: any;

  constructor() {
    this.promise = new Promise((resolve, reject) => {
      this.resolve = (file: IFilePayload) => {
        this.file = file;
        resolve(file);
      };

      this.reject = reject;
    });

    // eslint-disable-next-line @typescript-eslint/no-empty-function
    this.promise.catch(() => {});
  }
}

export default FileUploadInstance;
