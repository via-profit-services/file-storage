import path from 'path';

import {
  CACHE_FILES_DEFAULT_TTL,
  TEMPORARY_FILES_DEFAULT_TTL,
  DEFAULT_IMAGE_OPTIM_MAX_WIDTH,
  DEFAULT_IMAGE_OPTIM_MAX_HEIGHT,
  DEFAULT_STORAGE_PATH,
  DEFAULT_CACHE_PATH,
  DEFAULT_TEMPORARY_PATH,
  DEFAULT_STATIC_PREFIX,
  DEFAULT_CACHE_DELIMITER,
  DEFAULT_STATIC_DELIMITER,
  DEFAULT_TEMPORARY_DELIMITER,
  TIMEOUT_MAX_VALUE,
} from './constants';
import { IFileStorageInitialProps, IFileStorageParams } from './types';

interface IParamsBuffer {
  params: IFileStorageParams;
}

const isDev = process.env.NODE_ENV === 'development';
const rootPath = isDev
  ? path.resolve(path.dirname(process.argv[1]), '..')
  : path.resolve(path.dirname(process.argv[1]));

const paramsBuffer: IParamsBuffer = {
  params: {
    storagePath: DEFAULT_STORAGE_PATH,
    cachePath: DEFAULT_CACHE_PATH,
    temporaryPath: DEFAULT_TEMPORARY_PATH,
    staticPrefix: DEFAULT_STATIC_PREFIX,
    cacheTTL: CACHE_FILES_DEFAULT_TTL,
    temporaryTTL: TEMPORARY_FILES_DEFAULT_TTL,
    imageOptimMaxWidth: DEFAULT_IMAGE_OPTIM_MAX_WIDTH,
    imageOptimMaxHeight: DEFAULT_IMAGE_OPTIM_MAX_HEIGHT,
    staticDelimiter: DEFAULT_STATIC_DELIMITER,
    cacheDelimiter: DEFAULT_CACHE_DELIMITER,
    temporaryDelimiter: DEFAULT_TEMPORARY_DELIMITER,
    rootPath,
    hostname: '',
    staticPrefixAbsolutePath: '',
    storageAbsolutePath: '',
    cacheAbsolutePath: '',
    temporaryAbsolutePath: '',
    compressionOptions: {
      mozJpeg: { quality: 70 },
      pngQuant: { quality: [0.8, 0.8] },
      optiPng: { optimizationLevel: 3 },
    },
  },
};

export const setParams = (params?: Partial<IFileStorageInitialProps>) => {
  // merge options with defaults
  paramsBuffer.params = {
    ...paramsBuffer.params,
    ...params,
  };

  // fuse for timout max value
  paramsBuffer.params.cacheTTL = Math.min(
    TIMEOUT_MAX_VALUE / 1000, paramsBuffer.params.cacheTTL || CACHE_FILES_DEFAULT_TTL,
  );

  paramsBuffer.params.temporaryTTL = Math.min(
    TIMEOUT_MAX_VALUE / 1000, paramsBuffer.params.temporaryTTL || TEMPORARY_FILES_DEFAULT_TTL,
  );

  // resolve absolute paths
  paramsBuffer.params = {
    ...paramsBuffer.params,
    staticPrefixAbsolutePath: path.resolve(rootPath, paramsBuffer.params.staticPrefix),
    storageAbsolutePath: path.resolve(rootPath, paramsBuffer.params.storagePath),
    cacheAbsolutePath: path.resolve(rootPath, paramsBuffer.params.cachePath),
    temporaryAbsolutePath: path.resolve(rootPath, paramsBuffer.params.temporaryPath),
  };
};

export const getParams = () => paramsBuffer.params;

export default paramsBuffer;
