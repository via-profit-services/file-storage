declare module '@via-profit-services/file-storage' {
  import { Middleware, MiddlewareProps, Context, ListResponse, InputFilter, OutputFilter } from '@via-profit-services/core';
  import fs from 'fs';
  import { RequestHandler } from 'express';
  import { GraphQLFieldResolver } from 'graphql';
  import { WriteStream } from 'fs-capacitor';

  export type Resolvers = {
    Query: {
      fileStorage: GraphQLFieldResolver<unknown, Context>;
    };
    Mutation: {
      fileStorage: GraphQLFieldResolver<unknown, Context>;
    };
    FileStorageQuery: {
      file: GraphQLFieldResolver<unknown, Context, FileResolverParent>;
      list: GraphQLFieldResolver<unknown, Context, InputFilter>;
    };
    FileStorageMutation: {
      clearCache: GraphQLFieldResolver<unknown, Context>;
      applyTemporary: GraphQLFieldResolver<unknown, Context, {
        ids: string[];
        info: UpdateFileInput[];
      }>;
      delete: GraphQLFieldResolver<unknown, Context, {
        ids?: string[];
        owners?: string[];
      }>;
      update: GraphQLFieldResolver<unknown, Context, {
        info: UpdateFileInput[];
      }>;
      upload: GraphQLFieldResolver<unknown, Context, {
        files: File[];
        info: UploadFileInput[];
      }>;
      uploadTemporary: GraphQLFieldResolver<unknown, Context, {
        files: File[];
        info: UploadFileInput[];
      }>;
    };
    File: FileResolver;
    TransformedFile: TransformedFileResolver;
    TemporaryFile: TemporaryFileResolver;
  }

  export type FileResolverParent = {
    id: string;
    transform?: ImageTransform;
  }

  export type FileResolver = Record<
    | 'id'
    | 'createdAt'
    | 'updatedAt'
    | 'owner'
    | 'category'
    | 'mimeType'
    | 'url'
    | 'type'
    | 'description'
    | 'metaData'
    | 'transform'
    , GraphQLFieldResolver<FileResolverParent, Context, {
      transform: ImageTransform;
    }>>;

    export type TransformedFileResolver = Record<
    | 'id'
    | 'createdAt'
    | 'updatedAt'
    | 'owner'
    | 'category'
    | 'mimeType'
    | 'url'
    | 'type'
    | 'description'
    | 'metaData'
    | 'reference'
    , GraphQLFieldResolver<{
      reference: FileBag;
      transform: ImageTransform;
    }, Context>>;

  export type TemporaryFileResolver = Record<
    | 'id'
    | 'createdAt'
    | 'updatedAt'
    | 'owner'
    | 'category'
    | 'mimeType'
    | 'url'
    | 'type'
    | 'description'
    | 'metaData'
    | 'expiredAt'
    , GraphQLFieldResolver<{ id: string }, Context>>;

  export type FileType = 'image' | 'document' | 'template';

  export type ExpressMiddlewareFactory = (props: {
    configuration: Configuration;
  }) => RequestHandler

  export type ContextMiddlewareFactory = (props: {
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
     * Categories of files (e.g. «Avatar», Infoice»)
     */
    categories?: string[];

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

    maxFieldSize?: number;
    maxFileSize?: number;
    maxFiles?: number;
  }


  export type FileStorageParams = Required<Configuration> & {
    context: Context;
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


  export interface FilePayload {
    filename: string;
    mimeType: string;
    encoding: string;
    capacitor: WriteStream,
    createReadStream: (name?: string) => fs.ReadStream;
  }

  export type File = Promise<FilePayload>;

  export interface RedisFileValue {
    id: string;
    ext: string;
    exp: number;
  }

  export interface RedisTemporaryValue {
    id: string;
    exp: number;
    filename: string;
    fileInfo: UploadFileInput;
  }


  export type FileStorageMiddlewareFactory = (configuration: Configuration) => Promise<{
    fileStorageMiddleware: Middleware;
    graphQLFilesUploadExpress: RequestHandler;
    resolvers: Resolvers;
    typeDefs: string;
  }>;


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
    // clearExpiredTemporaryFiles(): Promise<void>;
    clearCache(): Promise<void>;
    clearTemporary(): Promise<void>;
    checkFileInCache(imageDataHash: string): Promise<RedisFileValue | null>;
    copyFile(from: string, to: string): Promise<void>;
    /**
     * Returns Full filename without extension (e.g. /path/to/file)
     */
    getPathFromUuid(guid: string): string;
    applyTransform(filepath: string, transform: Partial<ImageTransform>): Promise<string>;

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
    removeEmptyDirectories(directory: string): void;
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
    rebaseCategories(categories: string[]): Promise<void>;
    transformPayloadToUrl(data: TransformUrlPayload): string;
    urlToTransformPayload(url: string): TransformUrlPayload | false;
    encodeFileID(id: string): string;
    decodeFileID(url: string): string;
    setFileCache(id: string, filename: string): Promise<void>;
    resolveFile(params: {id: string, mimeType: string}): {
      resolvePath: string;
      resolveAbsolutePath: string;
    }
  }

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