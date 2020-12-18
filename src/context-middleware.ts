import { collateForDataloader } from '@via-profit-services/core';
import type { ContextMiddlewareFactory } from '@via-profit-services/file-storage';
import DataLoader from 'dataloader';

import filesLogger from './files-logger';
import FileStorageService from './FileStorageService';


const contextMiddlewareFactory: ContextMiddlewareFactory = (props) => {
  const { context, config, configuration } = props;
  const { logDir } = config;

  // FileStorage Service
  context.services.files = new FileStorageService({
    context,
    configuration,
  });

  // Files logger Logger
  context.logger.files = filesLogger({ logDir });

  // Accounts Dataloader
  context.dataloader.files = new DataLoader(async (ids: string[]) => {
    const nodes = await context.services.files.getFilesByIds(ids);

    return collateForDataloader(ids, nodes);
  });

  // Users Dataloader
  context.dataloader.tremporaryFiles = new DataLoader(async (ids: string[]) => {
    const nodes = await context.services.files.getTemporaryFilesByIds(ids);

    return collateForDataloader(ids, nodes);
  });

  return context;
}

export default contextMiddlewareFactory;
