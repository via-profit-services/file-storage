import { Middleware } from '@via-profit-services/core';
import { FileStorageMiddlewareFactory, ExpressMiddleware } from '@via-profit-services/file-storage';

import contextMiddleware from './context-middleware';
import expressMiddleware from './express-middleware';

const middlewareFactory: FileStorageMiddlewareFactory = (configuration) => {

  const pool: ReturnType<Middleware> = {
    context: null,
  };

  const fileStorageMiddleware: Middleware = async (props) => {
    const { context } = props;

    pool.context = pool.context ?? contextMiddleware({
      configuration,
      context,
      config: props.config,
    });

    return pool;
  }

  // const fileStorageExpress = expressMiddleware({ context: pool.context });

  return {
    fileStorageMiddleware,
    // fileStorageExpress,
  }
}

export default middlewareFactory;
