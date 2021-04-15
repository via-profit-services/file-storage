import type { FilePayload, ExpressMiddlewareFactory } from '@via-profit-services/file-storage';
import Busboy from 'busboy';
import { RequestHandler } from 'express';
import { WriteStream } from 'fs-capacitor';

import {
  DEFAULT_MAX_FIELD_SIZE,
  DEFAULT_MAX_FILES,
  DEFAULT_MAX_FILE_SIZE,
} from './constants';
import FileUploadInstance from './utils/FileUploadInstance';


const expressMiddlewareFactory: ExpressMiddlewareFactory = (props) => {
  const { configuration } = props;
  const { maxFieldSize, maxFileSize, maxFiles } = configuration;
  const limits = {
    maxFieldSize: maxFieldSize || DEFAULT_MAX_FIELD_SIZE,
    maxFileSize: maxFileSize || DEFAULT_MAX_FILE_SIZE,
    maxFiles: maxFiles || DEFAULT_MAX_FILES,
  };

  const graphQLFilesUploadExpress: RequestHandler = async (request, response, next) => {
    if (!request.is('multipart/form-data')) {

      next();

      return;
    }


    const finished = new Promise((resolve) => request.on('end', resolve));
    const throwError = (message: string) => {
        response.status(400).send({
          data: null,
          errors: [{
            message,
          }],
        });
    }

    // finished.then(() => {
    //   next();
    // });
    const { send } = response;
    (response.send as any) = (...args: any[]) => {
      // console.log(JSON.stringify(args));
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
        throwError(
          `The ‘${fieldName}’ multipart field value exceeds the ${limits.maxFieldSize} byte size limit.`,
        );

        return;
      }

      if (fieldName === 'operations') {
        try {
          operations = JSON.parse(value);
        } catch (error) {
          throwError('Invalid JSON in the «operations» multipart field');

          return;
        }
      }

      if (fieldName === 'map') {
        try {
          const mapData = JSON.parse(value) as {[key: string]: string[]};

          Object.entries(mapData).forEach(([key]) => {
            map.set(Number(key), new FileUploadInstance());
          });
        } catch (error) {
          throwError('Invalid JSON in the «map» field');

          return;
        }

        // put files into variables
        try {
          operations.variables.files = operations.variables.files.map((any, index) => {
            const file = map.get(index);

            if (!file) {
              throwError(`Can't assing file with index «${index}»`);
            }

            return file;
          });
        } catch (err) {
          throwError('Can\'t assing file from variables');

          return;
        }

        // replace body to new requst data with files in the variables
        request.body = operations;
        next();
      }
    });

    // FILE PARSER
    parser.on('file', (fieldName, stream, filename, encoding, mimeType) => {

      // console.log('File detected')
      const upload = map.get(Number(fieldName));

      if (!upload) {
        throwError(`File from field «${fieldName}» are not registered in map field`);

        return;
      }

      if (!upload?.resolve) {
        throwError(`File from field «${fieldName}» are not registered in map field`);

        return;
      }

      const capacitor = new WriteStream();
      capacitor.on('error', () => {
        stream.unpipe();
        stream.resume();
      });

      stream.on('limit', () => {
        throwError(`File truncated as it exceeds the ${limits.maxFileSize} byte size limit.`);
      });

      stream.on('error', (_error: Error) => {
        stream.unpipe();
        capacitor.destroy(new Error('Upload error'));
        capacitor.destroy()

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
      throwError(`${limits.maxFiles} max file uploads exceeded.`);
    });

    // FINISH PARSER
    parser.once('finish', () => {
      // console.log('finished')
      request.unpipe(parser);
      request.resume();


      if (operations === null) {
        throwError('Missing multipart field «operations»');

        return;
      }

      if (!map.size) {
        throwError('Missing multipart field «map»');

        return;
      }
    });


    parser.once('error', (err: Error) => {
      console.error(err)
      throwError('Unknown error');
    });

    request.pipe(parser);
  }

  return graphQLFilesUploadExpress;
}

export default expressMiddlewareFactory;
