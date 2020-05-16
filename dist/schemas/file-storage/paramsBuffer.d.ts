import { IFileStorageInitialProps, IFileStorageParams } from './types';
interface IParamsBuffer {
    params: IFileStorageParams;
}
declare const paramsBuffer: IParamsBuffer;
export declare const setParams: (params?: Partial<IFileStorageInitialProps>) => void;
export declare const getParams: () => IFileStorageParams;
export default paramsBuffer;
