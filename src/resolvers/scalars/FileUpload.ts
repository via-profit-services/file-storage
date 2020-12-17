import { GraphQLScalarType, GraphQLError } from 'graphql';
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

    // eslint-disable-next-line @typescript-eslint/no-empty-function
    this.promise.catch(() => {});
  }
}

const FileUpload = new GraphQLScalarType({
  name: 'FileUpload',
  description: 'The `Upload` scalar type represents a file upload.',
  parseValue(value) {
    if (value instanceof FileUploadInstance) {
      return value.promise;
    }

    throw new GraphQLError('Upload value invalid');
  },
  parseLiteral(ast) {
    throw new GraphQLError('Upload literal unsupported', ast);
  },
  serialize() {
    throw new GraphQLError('Upload serialization unsupported');
  },
});

export default FileUpload;
