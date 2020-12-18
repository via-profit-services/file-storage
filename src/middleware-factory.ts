import { Middleware } from '@via-profit-services/core';
import { FileStorageMiddlewareFactory } from '@via-profit-services/file-storage';

import contextMiddlewareFactory from './context-middleware';
import expressMiddlewareFactory from './express-middleware';

const middlewareFactory: FileStorageMiddlewareFactory = (configuration) => {

  const pool: ReturnType<Middleware> = {
    context: null,
  };

  const fileStorageMiddleware: Middleware = async (props) => {
    const { context } = props;

    pool.context = pool.context ?? contextMiddlewareFactory({
      configuration,
      context,
      config: props.config,
    });

    return pool;
  }

  const graphQLFilesExpress = expressMiddlewareFactory({ configuration });

  return {
    fileStorageMiddleware,
    graphQLFilesExpress,
  }
}

export default middlewareFactory;
