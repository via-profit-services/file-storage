import {
  IExpressMidlewareContainer, Express,
} from '@via-profit-services/core';

import { getParams } from './paramsBuffer';
import {
  IFileStorageInitialProps, Context, ExtendedContext,
} from './types';
import uploadMiddleware from './uploadMiddleware';

const expressMiddlewareFactory = (props: IFileStorageInitialProps): IExpressMidlewareContainer => {
  return (middlewareProps) => {
    const context = middlewareProps.context as Context;
    const { staticPrefix } = props;
    const { logger, endpoint } = context as ExtendedContext;
    const {
      storageAbsolutePath, staticDelimiter,
      cacheAbsolutePath, cacheDelimiter,
    } = getParams();
    const router = Express.Router();

    router.use(endpoint, uploadMiddleware({ context }));

    // express static for simple static directory
    router.use(`${staticPrefix}/${staticDelimiter}`, Express.static(storageAbsolutePath));
    logger.fileStorage.info(
      `Registered static directory in «${storageAbsolutePath}» with static prefix «${staticPrefix}»`,
    );


    // express static for the cache static directory
    router.use(`${staticPrefix}/${cacheDelimiter}`, Express.static(cacheAbsolutePath));
    logger.fileStorage.info(
      `Registered static cache directory in «${cacheAbsolutePath}»`,
    );

    return router;
  };
};

export default expressMiddlewareFactory;
