import { Router } from 'express';
import type { ExpressMiddleware } from '@via-profit-services/file-storage';


const expressMiddleware: ExpressMiddleware = (props) => {

  const { context } = props;
  const { services } = context;
  const router = Router();

  return router;
}

export default expressMiddleware;
