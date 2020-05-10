import path from 'path';
import { IFileStorageInitialProps, IFileStorageParams } from './types';

interface IParamsBuffer {
  params: IFileStorageParams;
}

const rootPath = path.join(__dirname, '..', '..', '..');

const paramsBuffer: IParamsBuffer = {
  params: {
    storagePath: '',
    staticPrefix: '',
    ssl: false,
    host: 'localhost',
    staticPrefixAbsolutePath: '',
    storageAbsolutePath: '',
    rootPath,
    imageOptimMaxWidth: 800,
    imageOptimMaxHeight: 600,
    staticDelimiter: 's',
    genericDelimiter: 'g',
  },
};

export const setParams = (params: Partial<IFileStorageInitialProps>) => {
  const staticPrefixAbsolutePath = path.resolve(rootPath, params.staticPrefix);
  const storageAbsolutePath = path.resolve(rootPath, params.storagePath);

  paramsBuffer.params = {
    ...paramsBuffer.params,
    ...params,
    staticPrefixAbsolutePath,
    storageAbsolutePath,
  };
};

export const getParams = () => paramsBuffer.params;

export default paramsBuffer;
