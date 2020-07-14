import { ReadStream } from 'fs';
import { IContext, ILoggerCollection } from '@via-profit-services/core';
import { WriteStream } from 'fs-capacitor';
import { Options as ImagenimMozjpegOption } from 'imagemin-mozjpeg';
import { Options as ImagenimOptiPngOption } from 'imagemin-optipng';
import { Options as ImagenimPngQuantOption } from 'imagemin-pngquant';
import { Logger } from 'winston';


export enum FileType {
  image = 'image',
  document = 'document',
}


export type Context = Pick<IContext, 'knex' | 'timezone' | 'token' | 'redis' | 'endpoint'>;

export interface ExtendedContext extends Context {
  logger: ILoggerCollection & {
    fileStorage: Logger;
  };
}


export interface IFileBag {
  id: string;
  owner: string | null;
  url: string;
  createdAt: Date;
  updatedAt: Date;
  category: string;
  mimeType: string;
  type: FileType;
  isLocalFile?: boolean;
  metaData?: any;
  description?: string;
}

export type IFileBagCreate = Omit<IFileBag, 'url' | 'id' | 'createdAt' | 'updatedAt'> & {
  id?: string;
  url?: string;
}

export type IFileBagTable = IFileBag & {
  totalCount: number;
};

export interface IFileBagTableInput {
  id?: string;
  type?: FileType;
  category: string;
  createdAt?: string;
  updatedAt?: string;
  isLocalFile?: boolean;
  metaData?: string;
  description?: string;
  url?: string;
  owner?: string;
  mimeType: string;
}

export interface IUploadFileInput {
  id?: string;
  category: string;
  type: FileType;
  owner: string;
  mimeType: string;
  isLocalFile?: boolean;
  metaData?: any;
  description?: string;
}

export interface IUpdateFileInput {
  id: string;
  owner?: string;
  category?: string;
  metaData?: any;
  description?: string;
}


export interface IFileStorageInitialProps {

  /**
   * e.g. `https://www.example.com:9000`
   */
  hostname: string;

  /**
   * Prefix path (e.g. `/static`)
   * @see https://expressjs.com/ru/starter/static-files.html
   */
  staticPrefix?: string;

  /**
   * Static `relative` path (e.g. `./public/fileStorage/files`).
   * Do not set absolute path!
   * @see https://expressjs.com/ru/starter/static-files.html
   */
  storagePath?: string;

  /**
   * Storage cache directory (e.g. `./public/fileStorage/cache`).
   * Do not set absolute path!
   */
  cachePath?: string;

  /**
   * Storage temporary directory (e.g. `./public/fileStorage/temp`).
   * Do not set absolute path!
   */
  temporaryPath?: string;


  /**
   * TTL for cache files (`in sec.`)\
   * The time after which the file will be deleted from the cache
   */
  cacheTTL?: number;

  /**
   * TTL for temporary files (`in sec.`)\
   * The time after which the file will be deleted from the temporary directory
   */
  temporaryTTL?: number;

  /**
   * Image maximum width
   */
  imageOptimMaxWidth?: number;

  /**
   * Image maximum height
   */
  imageOptimMaxHeight?: number;

  /**
   * Imagemin plugins options
   */
  compressionOptions?: {

    /**
     * Imagemin MozJpeg plugin settings
     * @see https://github.com/imagemin/imagemin-mozjpeg#readme
     */
    mozJpeg?: ImagenimMozjpegOption;

    /**
     * Imagemin OptiPng settings
     * @see https://github.com/imagemin/imagemin-optipng#readme
     */
    pngQuant?: ImagenimPngQuantOption;

    /**
     * Imagemin PngQuant settings
     * @see https://github.com/imagemin/imagemin-pngquant#readme
     */
    optiPng?: ImagenimOptiPngOption;
  }
}


export type IFileStorageParams = IFileStorageInitialProps & {
  staticPrefixAbsolutePath: string;
  storageAbsolutePath: string;
  cacheAbsolutePath: string;
  temporaryAbsolutePath: string;
  rootPath: string;


  /** URL delimeter of static content */
  staticDelimiter: string;

  /** URL delimiter for cached content */
  cacheDelimiter: string;

  /** URL delimiter for temporary content */
  temporaryDelimiter: string;

}


export interface IImageTransform {
  resize: {
    w: number;
    h: number;
  };
  cover: {
    w: number;
    h: number;
  };
  contain: {
    w: number;
    h: number;
  };
  scaleToFit: {
    w: number;
    h: number;
  };
  crop: {
    w: number;
    h: number;
    x: number;
    y: number;
  },
  gaussian: number;
  blur: number;
  greyscale: boolean;
}

export interface ITransformUrlPayload {

  /** File extension */
  ext: string;

  /** File original ID */
  id: string;

  /** Image transform options */
  transform: IImageTransform;
}


export interface IImgeData {
  payload: ITransformUrlPayload;
  token: string;
}


export interface IFilePayload {
  filename: string;
  mimeType: string;
  encoding: string;
  capacitor: WriteStream,
  createReadStream: (name?: string) => ReadStream;
}

export declare type IFile = Promise<IFilePayload>;

export interface IUploadLimits {
  maxFieldSize: number;
  maxFileSize: number;
  maxFiles: number;
}

export interface IUploadExpressMiddlewareProps {
  context: Context;
  limits?: Partial<IUploadLimits>
}

export interface IRedisFileValue {
  id: string;
  filename: string;
  exp: number;
}

export interface IRedisTemporaryValue {
  id: string;
  filename: string;
  exp: number;
  fileInfo: IUploadFileInput;
}
