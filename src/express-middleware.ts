import type { FilePayload, ExpressMiddlewareFactory } from '@via-profit-services/file-storage';
import Busboy from 'busboy';
import { RequestHandler } from 'express';
import { WriteStream } from 'fs-capacitor';

import { DEFAULT_MAX_FIELD_SIZE, DEFAULT_MAX_FILES, DEFAULT_MAX_FILE_SIZE } from './constants';
import FileUploadInstance from './utils/FileUploadInstance';


const expressMiddlewareFactory: ExpressMiddlewareFactory = (props) => {
  const { configuration } = props;
  const { maxFieldSize, maxFileSize, maxFiles } = configuration;
  const limits = {
    maxFieldSize: maxFieldSize || DEFAULT_MAX_FIELD_SIZE,
    maxFileSize: maxFileSize || DEFAULT_MAX_FILE_SIZE,
    maxFiles: maxFiles || DEFAULT_MAX_FILES,
  };

  const expressMiddleware: RequestHandler = async (request, response, next) => {
    if (!request.is('multipart/form-data')) {

      next();

      return;
    }


    const finished = new Promise((resolve) => request.on('end', resolve));
    const { send } = response;
    (response.send as any) = (...args: any[]) => {
      finished.then(() => {
        response.send = send;
        response.send(...args);
      });
    };


    const parser = new Busboy({
      headers: request.headers,
      limits: {
        fields: 2, // Only operations and map.
        ...limits,
      },
    });


    const map = new Map<number, FileUploadInstance>();
    let operations: {
        query: string;
        variables: {
          files: Array<FileUploadInstance | null>;
          [key: string]: any;
        }
      } | null = null;

    // FIELD PARSER
    parser.on('field', (fieldName, value, fieldNameTruncated, valueTruncated) => {
      if (valueTruncated) {
        throw new Error(
          `The ‘${fieldName}’ multipart field value exceeds the ${limits.maxFieldSize} byte size limit.`,
        );
      }

      if (fieldName === 'operations') {
        try {
          operations = JSON.parse(value);
        } catch (error) {
          throw new Error('Invalid JSON in the «operations» multipart field');
        }
      }

      if (fieldName === 'map') {
        try {
          const mapData = JSON.parse(value) as {[key: string]: string[]};

          Object.entries(mapData).forEach(([key]) => {
            map.set(Number(key), new FileUploadInstance());
          });
        } catch (error) {
          // logger.fileStorage.error('Invalid JSON in the «map» field');
          throw new Error('Invalid JSON in the «map» field');
        }

        // put files into variables
        try {
          operations.variables.files = operations.variables.files.map((any, index) => {
            const file = map.get(index);

            if (!file) {
              // logger.fileStorage.error(`Can't assing file with index «${index}»`);
              throw new Error(`Can't assing file with index «${index}»`);
            }

            return file;
          });
        } catch (err) {
          // logger.fileStorage.error('Can\'t assing file from variables', { err });
          throw new Error('Can\'t assing file from variables');
        }

        // replace body to new requst data with files in the variables
        request.body = operations;
        next();
      }
    });

    // FILE PARSER
      parser.on('file', (fieldName, stream, filename, encoding, mimeType) => {
      const upload = map.get(Number(fieldName));

      if (!upload) {
        // logger.fileStorage.error(`File from field «${fieldName}»
        // are not registered in map field`);
        throw new Error(`File from field «${fieldName}» are not registered in map field`);
      }

      const capacitor = new WriteStream();
      capacitor.on('error', () => {
        stream.unpipe();
        stream.resume();
      });

      stream.on('limit', () => {
        // logger.fileStorage.error(
        //   `File truncated as it exceeds the ${limits.maxFileSize} byte size limit.`,
        // );
        throw new Error(
          `File truncated as it exceeds the ${limits.maxFileSize} byte size limit.`,
        );
      });

      stream.on('error', (error: Error) => {
        stream.unpipe();
        console.error(error);
        capacitor.destroy(new Error('Upload error'));
      });

      const file: FilePayload = {
        filename,
        mimeType,
        encoding,
        capacitor,
        createReadStream: (name?: string) => capacitor.createReadStream(name),
      };

      Object.defineProperty(file, 'capacitor', { value: capacitor });

      stream.pipe(capacitor);
      upload.resolve(file);
    });


    // FILES LIMIT PARSER
    parser.once('filesLimit', () => {
      throw new Error(`${limits.maxFiles} max file uploads exceeded.`);
    });

    // FINISH PARSER
    parser.once('finish', () => {
      request.unpipe(parser);
      request.resume();


      if (operations === null) {
        throw new Error('Missing multipart field «operations»');
      }

      if (!map.size) {
        throw new Error('Missing multipart field «map»');
      }
    });


    parser.once('error', (err: Error) => {
      console.error(err)
      throw new Error('Unknown error');
    });

    request.pipe(parser);
  }

  return expressMiddleware;
}

export default expressMiddlewareFactory;
