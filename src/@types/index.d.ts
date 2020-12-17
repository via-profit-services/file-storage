declare module '@via-profit-services/file-storage' {
  import { Middleware, MiddlewareProps, Context, ListResponse, OutputFilter } from '@via-profit-services/core';
  import fs from 'fs';
  import { Router } from 'express';
  import { WriteStream } from 'fs-capacitor';
  import { Options as ImagenimMozjpegOption } from 'imagemin-mozjpeg';
  import { Options as ImagenimOptiPngOption } from 'imagemin-optipng';
  import { Options as ImagenimPngQuantOption } from 'imagemin-pngquant';

  export type FileType = 'image' | 'document' | 'template';

  export type ExpressMiddleware = (props: {
    context: Context;
  }) => Router;

  export type ContextMiddleware = (props: {
    context: Context;
    config: MiddlewareProps['config'];
    configuration: Configuration;
  }) => Context;

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


  export interface Configuration {

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


  export type FileStorageParams = Required<Configuration> & {
    context: Context;
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
    createReadStream: (name?: string) => fs.ReadStream;
  }

  export type File = Promise<FilePayload>;

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


  export type FileStorageMiddlewareFactory = (configuration: Configuration) => {
    fileStorageMiddleware: Middleware;
    // fileStorageExpress: ReturnType<ExpressMiddleware>;
  };

  /**
   * FileStorage service constructor props
   */
  export interface FileStorageServiceProps {
    context: Context;
    configuration: Configuration;
  }

  class FileStorageService {
    props: FileStorageParams;
    constructor(props: FileStorageServiceProps);
    getProps(): FileStorageParams;
    clearExpiredCacheFiles(): Promise<void>;
    clearExpiredTemporaryFiles(): Promise<void>;
    clearCache(): Promise<void>;
    clearTemporary(): Promise<void>;
    checkFileInCache(imageDataHash: string): Promise<IRedisFileValue | null>;
    makeImageCache(imageData: ImgeData, imageBuffer: Buffer): Promise<void>;
    compilePayloadCache(id: string, filename: string): string;
    getUrlWithTransform(imageData: Pick<FileBag, 'id' | 'url' | 'mimeType' | 'isLocalFile'>, transform: ImageTransform): Promise<string>;
    /**
     * Returns Full filename without extension (e.g. /path/to/file)
     */
    getPathFromUuid(guid: string): string;
    resolveFile(filedata: Pick<FileBag, 'id' | 'url' | 'mimeType' | 'isLocalFile'>): {
        resolveAbsolutePath: string;
        resolvePath: string;
    };
    applyTransform(filepath: string, transform: ImageTransform): Promise<void>;
    /**
     * Returns filename at static prefix root (e.g. /static/path/to/file.ext)
     */
    getFilenameFromUuid(guid: string, delimiter?: string): string;
    getStoragePath(): {
        storagePath: string;
        storageAbsolutePath: string;
    };
    getCachePath(): {
        cachePath: string;
        cacheAbsolutePath: string;
    };
    getTemporaryPath(): {
        temporaryPath: string;
        temporaryAbsolutePath: string;
    };
    getFileTypeByMimeType(mimeType: string): FileType;
    /**
     * Resolve extension by mimeType or return default `txt` extension
     */
    getExtensionByMimeType(mimeType: string): string;
    /**
     * Resolve mimeType by mime database or return default `text/plain` mimeType
     */
    getMimeTypeByExtension(extension: string): string;
    /**
     * Extract file extension
     */
    extractExtensionFromFilename(filename: string): string;
    /**
     * Extract file extension and try to resolve mimeType by mime database
     */
    getMimeTypeByFilename(filename: string): string;
    /**
     * Resolve mimeType. \
     * You may pass invalid mimeType but valid filename with extension \
     * This method should return valid mimeType \
     * \
     * `Note:` On Linux OS the file Manager can pass invalid mime types \
     * when uploading files to the server
     */
    resolveMimeType(filename: string, mimeType: string): string;
    /**
     * Create WriteStream and reutn it with the file data/
     * File will be registered in common file store
     */
    getFileStream(fileInfo: FileBagCreate): Promise<{
        stream: fs.WriteStream;
        file: FileBag;
    }>;
    /**
     * Create WriteStream and reutn it with the file data/
     * File will be registered in temporary file store and will be deleted at `expireAt`
     */
    getTemporaryFileStream(fileInfo: {
        mimeType: string;
        id?: string;
        expireAt?: number;
    }): Promise<{
        stream: fs.WriteStream;
        file: FileBag;
        expireAt: Date;
    }>;
    getTemporaryFile(id: string): Promise<TemporaryFileBag | false>;
    getFiles(filter: Partial<OutputFilter>): Promise<ListResponse<FileBag>>;
    getFilesByIds(ids: string[]): Promise<FileBag[]>;
    getFile(id: string): Promise<FileBag | false>;
    getTemporaryFilesByIds(ids: string[]): Promise<TemporaryFileBag[]>;
    preparePayloadToSQL(fileData: Partial<FileBag>): Partial<FileBagTableInput>;
    updateFile(id: string, fileData: Partial<FileBag>): Promise<string[]>;
    createTemporaryFile(fileStream: fs.ReadStream | null, fileInfo: UploadFileInput, expireAt?: number): Promise<{
        id: string;
        absoluteFilename: string;
    }>;
    compressImage(absoluteFilename: string): Promise<void>;
    createFile(fileStream: fs.ReadStream | null, fileInfo: FileBagCreate): Promise<{
        id: string;
        absoluteFilename: string;
    }>;
    moveFileFromTemporary(id: string): Promise<{
        id: string;
        absoluteFilename: string;
    }>;
    deleteFilesByOwner(owner: string | string[]): Promise<string[] | false>;
    flush(): Promise<void>;
    deleteStaticFiles(ids: string[]): Promise<string[]>;
  }

  export const resolvers: any;
  export const typeDefs: string;
  export const factory: FileStorageMiddlewareFactory;
}

declare module '@via-profit-services/core' {
  import { FileBag, TemporaryFileBag, FileStorageService } from '@via-profit-services/file-storage';
  import DataLoader from 'dataloader';

  interface DataLoaderCollection {

    /**
     * File storage common files dataloader
     */
    files: DataLoader<string, Node<FileBag>>;

    /**
     * File storage temporary files dataloader
     */
    tremporaryFiles: DataLoader<string, Node<TemporaryFileBag>>
  }

  interface ServicesCollection {
    files: FileStorageService;
  }

  interface LoggersCollection {
    /**
     * File Storage logger \
     * \
     * Transports:
     *  - `debug` - File transport
     *  - `error` - File transport
     *  - `info` - File transport
     */
    files: Logger;
  }
}