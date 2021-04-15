import type { FilePayload } from '@via-profit-services/file-storage';

class FileUploadInstance {
  public promise: Promise<any>;
  public resolve: (file: FilePayload) => void;
  public file: FilePayload;
  public reject: any;

  constructor() {
    this.promise = new Promise((resolve, reject) => {
      this.resolve = (file: FilePayload) => {
        this.file = file;
        resolve(file);
      };

      this.reject = reject;
    });

    this.promise.catch(() => {/* do nothing */});
  }
}

export default FileUploadInstance;
