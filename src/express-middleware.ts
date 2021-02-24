import type { FilePayload, ExpressMiddlewareFactory } from '@via-profit-services/file-storage';
import Busboy from 'busboy';
import express, { RequestHandler, Router } from 'express';
import { WriteStream } from 'fs-capacitor';
import path from 'path';

import {
  DEFAULT_MAX_FIELD_SIZE,
  DEFAULT_MAX_FILES,
  DEFAULT_MAX_FILE_SIZE,
  DEFAULT_STATIC_PREFIX,
  STATIC_DELIMITER,
  DEFAULT_STORAGE_PATH,
  DEFAULT_CACHE_PATH,
  CACHE_DELIMITER,
  TEMPORARY_DELIMITER,
  DEFAULT_TEMPORARY_PATH,
} from './constants';
import FileUploadInstance from './utils/FileUploadInstance';


const expressMiddlewareFactory: ExpressMiddlewareFactory = (props) => {
  const { configuration } = props;
  const {
    maxFieldSize, maxFileSize, maxFiles, staticPrefix,
    storagePath, cachePath, temporaryPath,
  } = configuration;
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
        response.status(400).send({
          errors: [{
            message: `The ‘${fieldName}’ multipart field value exceeds the ${limits.maxFieldSize} byte size limit.`,
          }],
        });

        next();
      }

      if (fieldName === 'operations') {
        try {
          operations = JSON.parse(value);
        } catch (error) {
          response.status(400).send({
            errors: [{
              message: 'Invalid JSON in the «operations» multipart field',
            }],
          });

          next();
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
          response.status(400).send({
            errors: [{
              message: 'Invalid JSON in the «map» field',
            }],
          });

          next();
        }

        // put files into variables
        try {
          operations.variables.files = operations.variables.files.map((any, index) => {
            const file = map.get(index);

            if (!file) {
              response.status(400).send({
                errors: [{
                  message: `Can't assing file with index «${index}»`,
                }],
              });
              next();
            }

            return file;
          });
        } catch (err) {
          response.status(400).send({
            errors: [{
              message: 'Can\'t assing file from variables',
            }],
          });

          next();
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
        response.status(400).send({
          errors: [{
            message: `File from field «${fieldName}» are not registered in map field`,
          }],
        });

        next();
      }

      const capacitor = new WriteStream();
      capacitor.on('error', () => {
        stream.unpipe();
        stream.resume();
      });

      stream.on('limit', () => {
        response.status(400).send({
          errors: [{
            message: `File truncated as it exceeds the ${limits.maxFileSize} byte size limit.`,
          }],
        });

        next();
      });

      stream.on('error', (error: Error) => {
        stream.unpipe();
        console.error(error);
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

      response.status(400).send({
        errors: [{
          message: `${limits.maxFiles} max file uploads exceeded.`,
        }],
      });

      next();
    });

    // FINISH PARSER
    parser.once('finish', () => {
      request.unpipe(parser);
      request.resume();


      if (operations === null) {
        response.status(400).send({
          errors: [{
            message: 'Missing multipart field «operations»',
          }],
        });

        next();
      }

      if (!map.size) {
        response.status(400).send({
          errors: [{
            message: 'Missing multipart field «map»',
          }],
        });

        next();
      }
    });


    parser.once('error', (err: Error) => {
      console.error(err)
      response.status(400).send({
        errors: [{
          message: 'Unknown error',
        }],
      });

      next();
    });

    request.pipe(parser);
  }


  const graphQLFilesStaticExpress = Router();
  const prefix = staticPrefix || DEFAULT_STATIC_PREFIX;
  const storageAbsolutePath = path.resolve(__dirname, '..', storagePath || DEFAULT_STORAGE_PATH);
  const cacheAbsolutePath = path.resolve(__dirname, '..', cachePath || DEFAULT_CACHE_PATH);
  const temporaryAbsolutePath = path.resolve(__dirname, '..', temporaryPath || DEFAULT_TEMPORARY_PATH);

  graphQLFilesStaticExpress.use(`${prefix}/${STATIC_DELIMITER}/`, express.static(storageAbsolutePath));
  graphQLFilesStaticExpress.use(`${prefix}/${CACHE_DELIMITER}/`, express.static(cacheAbsolutePath));
  graphQLFilesStaticExpress.use(`${prefix}/${TEMPORARY_DELIMITER}/`, express.static(temporaryAbsolutePath));

  return {
    graphQLFilesStaticExpress,
    graphQLFilesUploadExpress,
  };
}

export default expressMiddlewareFactory;
