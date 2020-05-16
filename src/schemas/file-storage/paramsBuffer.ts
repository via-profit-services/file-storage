import path from 'path';
import { IFileStorageInitialProps, IFileStorageParams } from './types';

interface IParamsBuffer {
  params: IFileStorageParams;
}

const rootPath = path.join(__dirname, '..', '..', '..');

const paramsBuffer: IParamsBuffer = {
  params: {
    storagePath: './public/fileStorage/files',
    cachePath: './public/fileStorage/cache',
    staticPrefix: '/static',
    hostname: 'http://localhost:80',
    clearCacheCronJob: '* 30 04 * * */6',
    staticPrefixAbsolutePath: '',
    storageAbsolutePath: '',
    cacheAbsolutePath: '',
    rootPath,
    imageOptimMaxWidth: 800,
    imageOptimMaxHeight: 600,
    staticDelimiter: 's',
    transformDelimiter: 't',
    cacheDelimiter: 'c',
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

  paramsBuffer.params = {
    ...paramsBuffer.params,
    staticPrefixAbsolutePath: path.resolve(rootPath, paramsBuffer.params.staticPrefix),
    storageAbsolutePath: path.resolve(rootPath, paramsBuffer.params.storagePath),
    cacheAbsolutePath: path.resolve(rootPath, paramsBuffer.params.cachePath),
  };
};

export const getParams = () => paramsBuffer.params;

export default paramsBuffer;
