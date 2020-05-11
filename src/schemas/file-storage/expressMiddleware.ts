import {
  IExpressMidlewareContainer, Express, IContext,
} from '@via-profit-services/core';

import { Context } from '../../context';
import { getParams } from './paramsBuffer';
import { IFileStorageInitialProps } from './types';


const expressMiddlewareFactory = (props: IFileStorageInitialProps): IExpressMidlewareContainer => {
  return ({ context }) => {
    const { staticPrefix } = props;
    const { logger } = context as IContext & Context;
    const {
      storageAbsolutePath, staticDelimiter,
    } = getParams();


    logger.fileStorage.info(
      `Registered static directory in [${storageAbsolutePath}] with static prefix [${staticPrefix}]`,
    );

    const router = Express.Router();
    router.use(`${staticPrefix}/${staticDelimiter}`, Express.static(storageAbsolutePath));
    return router;
  };
};

export default expressMiddlewareFactory;
