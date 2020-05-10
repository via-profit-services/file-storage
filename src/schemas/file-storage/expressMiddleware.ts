import fs from 'fs';
import https from 'https';
import path from 'path';
import {
  IExpressMidlewareContainer, Express, IContext, ServerError,
} from '@via-profit-services/core';
import Sharp from 'sharp';

import { Context } from '../../context';
import { getParams } from './paramsBuffer';
import FileStorageService from './service';
import { IFileStorageInitialProps } from './types';


const expressMiddlewareFactory = (props: IFileStorageInitialProps): IExpressMidlewareContainer => {
  return ({ context }) => {
    const { staticPrefix } = props;
    const { logger } = context as IContext & Context;
    const {
      storageAbsolutePath, genericDelimiter, staticDelimiter, rootPath,
    } = getParams();


    logger.fileStorage.info(
      `Registered static directory in [${storageAbsolutePath}] with static prefix [${staticPrefix}]`,
    );

    const router = Express.Router();
    router.use(`${staticPrefix}/${staticDelimiter}`, Express.static(storageAbsolutePath));

    router.use(`${staticPrefix}/r`, async (req, res, next) => {
      const { originalUrl } = req;
      const urlArray = originalUrl.split(staticPrefix);
      if (urlArray.length === 2) {
        const genericParams = urlArray[1].split('/').splice(1);
        if (genericParams.length === 4) {
          if (genericParams[0] === 'r' && genericParams[2] === 't') {
            const imgJson = Buffer.from(genericParams[1], 'base64').toString('utf8');
            const transform = Buffer.from(genericParams[3], 'base64').toString('utf8');


            let transformOptions: any;
            let imageData: any;
            try {
              transformOptions = JSON.parse(String(transform));
              imageData = JSON.parse(String(imgJson));
            } catch (err) {
              throw new ServerError('Failed to transform image', { err });
            }

            const filename = FileStorageService.getFilenameFromUuid(imageData.id);
            const absolutefilename = path.resolve(path.join(rootPath, `${filename}.${imageData.ext}`));
            const fileStream = fs.createReadStream(absolutefilename);
            const metaReader = Sharp().resize(transformOptions);
            metaReader.metadata()
              .catch((err) => {
                throw new ServerError('Failed to transform image', { err });
              });
            return fileStream.pipe(metaReader).pipe(res);
          }
        }
      }
      return next();
    });

    router.use(`${staticPrefix}/${genericDelimiter}`, (req, res, next) => {
      const { originalUrl } = req;
      const urlArray = originalUrl.split(staticPrefix);
      if (urlArray.length === 2) {
        const genericParams = urlArray[1].split('/').splice(1);
        if (genericParams.length === 4) {
          if (genericParams[0] === genericDelimiter && genericParams[2] === 't') {
            const url = Buffer.from(genericParams[1], 'base64').toString('utf8');
            const transform = Buffer.from(genericParams[3], 'base64').toString('utf8');

            let transformOptions: any;
            try {
              transformOptions = JSON.parse(String(transform));
            } catch (err) {
              throw new ServerError('Failed to transform image', { err });
            }

            return https.get(url, (fileStream) => {
              const metaReader = Sharp().resize(transformOptions);
              metaReader.metadata()
                .catch((err) => {
                  throw new ServerError('Failed to transform image', { err });
                });

              fileStream.pipe(metaReader).pipe(res);
            });
          }
        }
      }
      return next();
    });
    return router;
  };
};

export default expressMiddlewareFactory;
