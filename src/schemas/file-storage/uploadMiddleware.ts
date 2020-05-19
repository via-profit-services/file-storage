/* eslint-disable no-restricted-syntax */
import { Express, ServerError } from '@via-profit-services/core';
import Busboy from 'busboy';
import { WriteStream } from 'fs-capacitor';

import FileUploadInstance from './FileUploadInstance';
import {
  IFilePayload, IUploadExpressMiddlewareProps, IUploadLimits, ExtendedContext,
} from './types';

const graphqlUploadExpress = (props: IUploadExpressMiddlewareProps) => {
  const { context, limits } = props;
  const { logger } = context as ExtendedContext;

  return async (request: Express.Request, response: any, next: Express.NextFunction) => {
    if (!request.is('multipart/form-data')) {
      next();
      return;
    }


    const finished = new Promise((resolve) => request.on('end', resolve));
    const { send } = response;
    response.send = (...args: any[]) => {
      finished.then(() => {
        response.send = send;
        response.send(...args);
      });
    };

    const defaultLimits: IUploadLimits = {
      maxFieldSize: 1000000 * 64, // 64MB
      maxFileSize: Infinity,
      maxFiles: Infinity,
    };

    const parser = new Busboy({
      headers: request.headers,
      limits: {
        fields: 2, // Only operations and map.
        ...defaultLimits,
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


    parser.on('field', (fieldName, value, fieldNameTruncated, valueTruncated) => {
      if (valueTruncated) {
        logger.fileStorage.error(`The ‘${fieldName}’ multipart field value exceeds the ${limits.maxFieldSize} byte size limit.`);
        throw new ServerError(
          `The ‘${fieldName}’ multipart field value exceeds the ${limits.maxFieldSize} byte size limit.`,
        );
      }

      if (fieldName === 'operations') {
        try {
          operations = JSON.parse(value);
        } catch (error) {
          logger.fileStorage.error('Invalid JSON in the «operations» multipart field');
          throw new ServerError('Invalid JSON in the «operations» multipart field');
        }
      }

      if (fieldName === 'map') {
        try {
          const mapData = JSON.parse(value) as {[key: string]: string[]};

          Object.entries(mapData).forEach(([key]) => {
            map.set(Number(key), new FileUploadInstance());
          });
        } catch (error) {
          logger.fileStorage.error('Invalid JSON in the «map» field');
          throw new ServerError('Invalid JSON in the «map» field');
        }

        // put files into variables
        try {
          operations.variables.files = operations.variables.files.map((any, index) => {
            const file = map.get(index);

            if (!file) {
              logger.fileStorage.error(`Can't assing file with index «${index}»`);
              throw new ServerError(`Can't assing file with index «${index}»`);
            }
            return file;
          });
        } catch (err) {
          logger.fileStorage.error('Can\'t assing file from variables', { err });
          throw new ServerError('Can\'t assing file from variables');
        }

        // replace body to new requst data with files in the variables
        request.body = operations;
        next();
      }
    });


    parser.on('file', (fieldName, stream, filename, encoding, mimeType) => {
      const upload = map.get(Number(fieldName));

      if (!upload) {
        logger.fileStorage.error(`File from field «${fieldName}» are not registered in map field`);
        throw new ServerError(`File from field «${fieldName}» are not registered in map field`);
      }

      const capacitor = new WriteStream();
      capacitor.on('error', () => {
        stream.unpipe();
        stream.resume();
      });

      stream.on('limit', () => {
        logger.fileStorage.error(
          `File truncated as it exceeds the ${limits.maxFileSize} byte size limit.`,
        );
        throw new ServerError(
          `File truncated as it exceeds the ${limits.maxFileSize} byte size limit.`,
        );
      });

      stream.on('error', (error: Error) => {
        stream.unpipe();
        capacitor.destroy(new ServerError('Upload error', { error }));
      });

      const file: IFilePayload = {
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

    parser.once('filesLimit', () => {
      logger.fileStorage.error(`${limits.maxFiles} max file uploads exceeded.`);
      throw new ServerError(`${limits.maxFiles} max file uploads exceeded.`);
    });

    parser.once('finish', () => {
      request.unpipe(parser);
      request.resume();


      if (operations === null) {
        logger.fileStorage.error('Missing multipart field «operations»');
        throw new ServerError('Missing multipart field «operations»');
      }

      if (!map.size) {
        logger.fileStorage.error('Missing multipart field «map»');
        throw new ServerError('Missing multipart field «map»');
      }
    });

    parser.once('error', (err: Error) => {
      logger.fileStorage.error('Unknown error', err);
      throw new ServerError('Unknown error', err);
    });

    request.pipe(parser);
  };
};

export default graphqlUploadExpress;
