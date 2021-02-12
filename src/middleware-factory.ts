import { Middleware } from '@via-profit-services/core';
import { FileStorageMiddlewareFactory } from '@via-profit-services/file-storage';

import contextMiddlewareFactory from './context-middleware';
import expressMiddlewareFactory from './express-middleware';
import resolvers from './resolvers';
import typeDefs from './schema.graphql';

const middlewareFactory: FileStorageMiddlewareFactory = async (configuration) => {
  const { categories } = configuration;

  const categoriesList = new Set(
    [...categories || []].map((category) => category.replace(/[^a-zA-Z]/g, '')),
  );
  categoriesList.add('Avatar');
  configuration.categories = [...categoriesList];

  const pool: ReturnType<Middleware> = {
    context: null,
  };

  const timers: {cacheTimer: NodeJS.Timeout; temporaryTimer: NodeJS.Timeout;} = {
    cacheTimer: null,
    temporaryTimer: null,
  };

  const fileStorageMiddleware: Middleware = async (props) => {
    const { context } = props;

    // init context
    pool.context = pool.context ?? await contextMiddlewareFactory({
      configuration,
      context,
      config: props.config,
    });


    // Setup timers to cache clearing
    const { services, logger } = pool.context;
    const { cacheTTL, temporaryTTL } = services.files.getProps();
    await services.files.rebaseCategories([...categoriesList]);

    // setup it once
    if (!timers.cacheTimer) {
      services.files.clearExpiredCacheFiles();
      timers.cacheTimer = setInterval(() => {
        try {
          services.files.clearExpiredCacheFiles();
        } catch (err) {
          logger.files.error('Failed to clear expired cache files by interval', { err });
        }
      }, cacheTTL * 1000);
      logger.files.info(`A timer is set for clearing the cache for ${cacheTTL} sec.`);
    }

    // setup it once
    if (!timers.temporaryTimer) {
      timers.temporaryTimer = setInterval(() => {
        services.files.clearExpiredTemporaryFiles();
        try {
          services.files.clearExpiredTemporaryFiles();
        } catch (err) {
          logger.files.error('Failed to clear expired temporary files by interval', { err });
        }
      }, temporaryTTL * 1000);
      logger.files.info(`A timer is set for clearing the temporary for ${temporaryTTL} sec.`);
    }


    return pool;
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
