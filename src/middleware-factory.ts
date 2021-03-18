import { Middleware, collateForDataloader } from '@via-profit-services/core';
import { FileStorageMiddlewareFactory } from '@via-profit-services/file-storage';
import DataLoader from 'dataloader';
import express from 'express';

import FileStorageService from './FileStorageService';
import expressMiddlewareFactory from './express-middleware';
import filesLogger from './files-logger';
import resolvers from './resolvers';
import typeDefs from './schema.graphql';

const middlewareFactory: FileStorageMiddlewareFactory = async (configuration) => {
  const { categories } = configuration;

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
      cache.temporaryTimer = setInterval(() => {
        context.services.files.clearExpiredTemporaryFiles();
        try {
          context.services.files.clearExpiredTemporaryFiles();
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

  const {
    graphQLFilesStaticExpress,
    graphQLFilesUploadExpress,
  } = expressMiddlewareFactory({ configuration });

  return {
    fileStorageMiddleware,
    graphQLFilesStaticExpress,
    graphQLFilesUploadExpress,
    resolvers,
    typeDefs: `${typeDefs}
      enum FileCategory {
        ${[...categoriesList].join(',\n')}
      }`,
  }
}

export default middlewareFactory;
