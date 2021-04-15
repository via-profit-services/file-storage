/* eslint-disable import/max-dependencies */
import { Middleware, collateForDataloader } from '@via-profit-services/core';
import { FileStorageMiddlewareFactory } from '@via-profit-services/file-storage';
import crypto from 'crypto';
import DataLoader from 'dataloader';
import fs from 'fs';
import path from 'path';

import { DEFAULT_STATIC_PREFIX, CACHE_DELIMITER, STATIC_DELIMITER, TEMPORARY_DELIMITER } from './constants';
import expressMiddlewareFactory from './express-upload-middleware';
import filesLogger from './files-logger';
import FileStorageService from './FileStorageService';
import resolvers from './resolvers';
import typeDefs from './schema.graphql';


const middlewareFactory: FileStorageMiddlewareFactory = async (configuration) => {
  const { categories, staticPrefix } = configuration;
  const prefix = staticPrefix || DEFAULT_STATIC_PREFIX;

  const categoriesList = new Set(
    [...categories || []].map((category) => category.replace(/[^a-zA-Z]/g, '')),
  );
  categoriesList.add('Avatar');
  configuration.categories = [...categoriesList];

  type Cache = {
    cacheTimer: NodeJS.Timeout;
    temporaryTimer: NodeJS.Timeout;
    initDatabase: boolean;
  }

  type TransformedRouteParams = {
    transformUrlPayload: string;
    ext: string;
  }

  type StaticRouteParams = {
    id: string;
    ext: string;
  }

  type TemporaryRouteParams = {
    id: string;
    ext: string;
  }

  const cache: Cache = {
    cacheTimer: null,
    temporaryTimer: null,
    initDatabase: false,
  };


  const fileStorageMiddleware: Middleware = async ({ context, config }) => {
    const { logDir } = config;

    context.services.files = new FileStorageService({
      context,
      configuration,
    });


    /**
     * Static files
     */
    context.request.app.use<StaticRouteParams>(`${prefix}/${STATIC_DELIMITER}/:id.:ext`, async (req, res, next) => {
      const { params } = req;
      const { id, ext } = params;

      const filename = context.services.files.getPathFromUuid(id);
      const { storageAbsolutePath } = context.services.files.getStoragePath();
      const absoluteFilename = path.resolve(storageAbsolutePath, `${filename}.${ext}`);

      if (!fs.existsSync(absoluteFilename)) {
        return next();
      }

      return res.sendFile(absoluteFilename);

    });

    /**
     * Temporary files
     */
    context.request.app.use<TemporaryRouteParams>(`${prefix}/${TEMPORARY_DELIMITER}/:id.:ext`, async (req, res, next) => {
      const { params } = req;
      const { id, ext } = params;

      const filename = context.services.files.getPathFromUuid(id);
      const { temporaryAbsolutePath } = context.services.files.getTemporaryPath();
      const absoluteFilename = path.resolve(temporaryAbsolutePath, `${filename}.${ext}`);

      if (!fs.existsSync(absoluteFilename)) {
        return next();
      }

      return res.sendFile(absoluteFilename);

    });

    /**
     * Cached files (transformed)
     */
    context.request.app.use<TransformedRouteParams>(`${prefix}/${CACHE_DELIMITER}/:transformUrlPayload.:ext`, async (req, res, next) => {
      const { params } = req;
      const { transformUrlPayload } = params;

      // try to parse trannsform from url
      const data = context.services.files.urlToTransformPayload(transformUrlPayload);

      if (!data) {
        return next();
      }

      const { id, transform, ext } = data;

      // get transformed filename
      const transformedID = crypto.createHash('md5').update(JSON.stringify(transformUrlPayload)).digest('hex');
      const transformedFilename = context.services.files.getPathFromUuid(transformedID);
      const { cacheAbsolutePath } = context.services.files.getCachePath();
      const transformedAbsoluteFilename = path.resolve(cacheAbsolutePath, `${transformedFilename}.${ext}`);

      if (fs.existsSync(transformedAbsoluteFilename)) {
        return res.sendFile(transformedAbsoluteFilename);
      }


      const originalFilename = context.services.files.getPathFromUuid(id);
      const { storageAbsolutePath } = context.services.files.getStoragePath();
      const originalAbsoluteFilename = path.resolve(storageAbsolutePath, `${originalFilename}.${ext}`);

      if (!fs.existsSync(originalAbsoluteFilename)) {
        return next();
      }

      await context.services.files.copyFile(originalAbsoluteFilename, transformedAbsoluteFilename);
      await context.services.files.applyTransform(transformedAbsoluteFilename, transform);

      return res.sendFile(transformedAbsoluteFilename);

    });

    // Files logger Logger
    context.logger.files = filesLogger({ logDir });

    // Files Dataloader
    context.dataloader.files = new DataLoader(async (ids: string[]) => {
      const nodes = await context.services.files.getFilesByIds(ids);

      return collateForDataloader(ids, nodes);
    });

    // Users Dataloader
    context.dataloader.tremporaryFiles = new DataLoader(async (ids: string[]) => {
      const nodes = await context.services.files.getTemporaryFilesByIds(ids);

      return collateForDataloader(ids, nodes);
    });


    // Setup timers to cache clearing
    const { cacheTTL, temporaryTTL } = context.services.files.getProps();

    // setup it once
    if (!cache.initDatabase) {
      await context.services.files.rebaseCategories([...categoriesList]);
      cache.initDatabase = true;
    }

    // setup it once
    if (!cache.cacheTimer) {
      context.services.files.clearExpiredCacheFiles();
      cache.cacheTimer = setInterval(() => {
        try {
          context.services.files.clearExpiredCacheFiles();
        } catch (err) {
          context.logger.files.error('Failed to clear expired cache files by interval', { err });
        }
      }, cacheTTL * 1000);
      context.logger.files.info(`A timer is set for clearing the cache for ${cacheTTL} sec.`);
    }

    // setup it once
    if (!cache.temporaryTimer) {
      // context.services.files.clearExpiredTemporaryFiles();
      cache.temporaryTimer = setInterval(() => {
        try {
          // context.services.files.clearExpiredTemporaryFiles();
        } catch (err) {
          context.logger.files.error('Failed to clear expired temporary files by interval', { err });
        }
      }, temporaryTTL * 1000);
      context.logger.files.info(`A timer is set for clearing the temporary for ${temporaryTTL} sec.`);
    }

    return {
      context,
    };
  }

  const graphQLFilesUploadExpress = expressMiddlewareFactory({ configuration });

  return {
    fileStorageMiddleware,
    graphQLFilesUploadExpress,
    resolvers,
    typeDefs: `${typeDefs}
      enum FileCategory {
        ${[...categoriesList].join(',\n')}
      }`,
  }
}

export default middlewareFactory;
