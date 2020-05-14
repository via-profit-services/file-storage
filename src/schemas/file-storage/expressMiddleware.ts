import fs from 'fs';
import path from 'path';
import {
  IExpressMidlewareContainer, Express, IContext,
} from '@via-profit-services/core';
import Jimp from 'jimp';

import { Context } from '../../context';
import { getParams } from './paramsBuffer';
import FileStorageService from './service';
import { IFileStorageInitialProps, ITransformUrlPayload, IImageTransform } from './types';


const expressMiddlewareFactory = (props: IFileStorageInitialProps): IExpressMidlewareContainer => {
  return (middlewareProps) => {
    const context = middlewareProps.context as IContext & Context;
    const { staticPrefix } = props;
    const { logger } = context;
    const {
      storageAbsolutePath, staticDelimiter, transformDelimiter, rootPath,
    } = getParams();
    const fileStorage = new FileStorageService({ context });

    logger.fileStorage.info(
      `Registered static directory in [${storageAbsolutePath}] with static prefix [${staticPrefix}]`,
    );

    const router = Express.Router();

    // express static
    router.use(`${staticPrefix}/${staticDelimiter}`, Express.static(storageAbsolutePath));
    router.use(`${staticPrefix}/c`, Express.static(path.join(storageAbsolutePath, 'cache')));

    // transforms
    router.use(`${staticPrefix}/${transformDelimiter}`, async (req, res) => {
      let fileData: {payload: ITransformUrlPayload; token: string};
      try {
        fileData = fileStorage.getImageDataFromTransformUrl(req.originalUrl);
      } catch (err) {
        logger.fileStorage.error('Failed to URL decode');
        return res.status(400).end();
      }

      const { payload, token } = fileData;

      // check to cache
      const filenameInCache = await fileStorage.checkFileInCache(token);
      if (filenameInCache) {
        if (fs.existsSync(filenameInCache)) {
          return res.sendFile(filenameInCache);
        }
      }


      let jimpHandle: Jimp;

      try {
        jimpHandle = await Jimp.read(
          payload.url
            ? payload.url
            : `${path.resolve(path.join(rootPath, FileStorageService.getFilenameFromUuid(payload.id)))}.${payload.ext}`,
        );
      } catch (err) {
        logger.fileStorage.error('Failed to read image', { err });
        return res.status(400).end();
      }

      const mimeType = FileStorageService.getMimeTypeByExtension(payload.ext);
      const { transform } = payload;


      Object.entries(transform).forEach(([method, options]) => {
        // Resize
        if (method === 'resize') {
          const { width, height } = options as IImageTransform['resize'];
          jimpHandle = jimpHandle.resize(width, height);
        }

        if (method === 'cover') {
          const { width, height } = options as IImageTransform['cover'];
          jimpHandle = jimpHandle.cover(width, height);
        }

        if (method === 'contain') {
          const { width, height } = options as IImageTransform['contain'];
          jimpHandle = jimpHandle.contain(width, height);
        }

        if (method === 'scaleToFit') {
          const { width, height } = options as IImageTransform['scaleToFit'];
          jimpHandle = jimpHandle.scaleToFit(width, height);
        }

        if (method === 'gaussian') {
          const gaussian = options as IImageTransform['gaussian'];
          jimpHandle = jimpHandle.gaussian(gaussian);
        }

        if (method === 'blur') {
          const blur = options as IImageTransform['blur'];
          jimpHandle = jimpHandle.gaussian(blur);
        }

        if (method === 'greyscale') {
          const greyscale = options as IImageTransform['greyscale'];
          if (greyscale === true) {
            jimpHandle = jimpHandle.grayscale();
          }
        }
      });


      try {
        const buffer = await jimpHandle.getBufferAsync(mimeType);

        // save into the cache
        fileStorage.saveImageIntoTheCache(fileData, buffer);

        res.writeHead(200, {
          'Content-Type': mimeType,
        });

        res.end(buffer, 'binary');
      } catch (err) {
        logger.fileStorage.error('Failed to get image buffer');
        return res.status(400).end();
      }

      return res.status(400).end();
    });
    return router;
  };
};

export default expressMiddlewareFactory;
