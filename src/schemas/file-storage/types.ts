import { IContext, ILoggerCollection, Winston } from '@via-profit-services/core';
import { ReadStream } from 'fs';
import { WriteStream } from 'fs-capacitor';
import { Options as ImagenimMozjpegOption } from 'imagemin-mozjpeg';
import { Options as ImagenimOptiPngOption } from 'imagemin-optipng';
import { Options as ImagenimPngQuantOption } from 'imagemin-pngquant';


export enum FileType {
  image = 'image',
  document = 'document',
  template = 'template',
}


export type Context = Pick<IContext, 'knex' | 'timezone' | 'token' | 'redis' | 'endpoint'>;

export interface ExtendedContext extends Context {
  logger: ILoggerCollection & {
    fileStorage: Winston.Logger;
  };
}


export interface FileBag {
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

export interface TemporaryFileBag extends FileBag {
  expiredAt: Date;
}

export type FileBagCreate = Omit<FileBag, 'url' | 'id' | 'createdAt' | 'updatedAt'> & {
  id?: string;
  url?: string;
}

export type FileBagTable = FileBag & {
  totalCount: number;
};

export interface FileBagTableInput {
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

export interface UploadFileInput {
  id?: string;
  category: string;
  type: FileType;
  owner: string;
  mimeType: string;
  isLocalFile?: boolean;
  metaData?: any;
  description?: string;
}

export interface UpdateFileInput {
  id: string;
  owner?: string;
  category?: string;
  metaData?: any;
  description?: string;
  type?: FileType;
}


export interface FileStorageInitialProps {

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


export type FileStorageParams = FileStorageInitialProps & {
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


export interface ImageTransform {
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

export interface TransformUrlPayload {

  /** File extension */
  ext: string;

  /** File original ID */
  id: string;

  /** Image transform options */
  transform: ImageTransform;
}


export interface ImgeData {
  payload: TransformUrlPayload;
  token: string;
}


export interface FilePayload {
  filename: string;
  mimeType: string;
  encoding: string;
  capacitor: WriteStream,
  createReadStream: (name?: string) => ReadStream;
}

export declare type File = Promise<FilePayload>;

export interface UploadLimits {
  maxFieldSize: number;
  maxFileSize: number;
  maxFiles: number;
}

export interface UploadExpressMiddlewareProps {
  context: Context;
  limits?: Partial<UploadLimits>
}

export interface IRedisFileValue {
  id: string;
  filename: string;
  exp: number;
}

export interface RedisTemporaryValue {
  id: string;
  filename: string;
  exp: number;
  fileInfo: UploadFileInput;
}
