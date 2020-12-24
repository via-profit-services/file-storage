import { Middleware } from '@via-profit-services/core';
import { FileStorageMiddlewareFactory } from '@via-profit-services/file-storage';

import contextMiddlewareFactory from './context-middleware';
import expressMiddlewareFactory from './express-middleware';

const middlewareFactory: FileStorageMiddlewareFactory = (configuration) => {

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
    pool.context = pool.context ?? contextMiddlewareFactory({
      configuration,
      context,
      config: props.config,
    });


    // Setup timers to cache clearing
    const { services, logger } = pool.context;
    const { cacheTTL, temporaryTTL } = services.files.getProps();

    services.files.clearExpiredCacheFiles();
    services.files.clearExpiredTemporaryFiles();

    clearInterval(timers.cacheTimer);
    timers.cacheTimer = setInterval(() => {
      try {
        services.files.clearExpiredCacheFiles();
      } catch (err) {
        logger.files.error('Failed to clear expired cache files by interval', { err });
      }
    }, cacheTTL * 1000);
    logger.files.info(`A timer is set for clearing the cache for ${cacheTTL} sec.`);

    clearInterval(timers.temporaryTimer);
    timers.temporaryTimer = setInterval(() => {
      try {
        services.files.clearExpiredTemporaryFiles();
      } catch (err) {
        logger.files.error('Failed to clear expired temporary files by interval', { err });
      }
    }, temporaryTTL * 1000);
    logger.files.info(`A timer is set for clearing the temporary for ${temporaryTTL} sec.`);

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
  }
}

export default middlewareFactory;
