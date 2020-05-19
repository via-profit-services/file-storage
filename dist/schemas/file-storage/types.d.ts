/// <reference types="node" />
import { ReadStream } from 'fs';
import { IContext, ILoggerCollection } from '@via-profit-services/core';
import { WriteStream } from 'fs-capacitor';
import { Options as ImagenimMozjpegOption } from 'imagemin-mozjpeg';
import { Options as ImagenimOptiPngOption } from 'imagemin-optipng';
import { Options as ImagenimPngQuantOption } from 'imagemin-pngquant';
import { Logger } from 'winston';
export declare enum FileType {
    image = "image",
    document = "document"
}
export declare type Context = Pick<IContext, 'knex' | 'timezone' | 'token' | 'redis' | 'endpoint'>;
export interface ExtendedContext extends Context {
    logger: ILoggerCollection & {
        fileStorage: Logger;
    };
}
export interface IFileBag {
    id: string;
    owner: string;
    url: string;
    createdAt: Date;
    updatedAt: Date;
    category: string;
    mimeType: string;
    type: FileType;
    isLocalFile?: boolean;
    metaData?: Object | Array<any>;
    description?: string;
    /** Only for images */
    width?: number;
    height?: number;
}
export declare type IFileBagTable = IFileBag & {
    totalCount: number;
};
export interface IFileBagTableInput {
    id?: string;
    type?: FileType;
    category: string;
    createdAt?: string;
    updatedAt?: string;
    isLocalFile?: boolean;
    metaData?: Object | Array<any>;
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
    metaData?: Object | Array<any>;
    description?: string;
}
export interface IFileStorageInitialProps {
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
     * Host or hostname without protocol ang schema (`www.example.com`)
     */
    hostname?: string;
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
    };
}
export declare type IFileStorageParams = IFileStorageInitialProps & {
    staticPrefixAbsolutePath: string;
    storageAbsolutePath: string;
    cacheAbsolutePath: string;
    rootPath: string;
    /** URL delimeter of static content */
    staticDelimiter: string;
    /** URL delimiter for cached content */
    cacheDelimiter: string;
};
export interface IImageTransform {
    resize: {
        width: number;
        height: number;
    };
    cover: {
        width: number;
        height: number;
    };
    contain: {
        width: number;
        height: number;
    };
    scaleToFit: {
        width: number;
        height: number;
    };
    gaussian: number;
    blur: number;
    greyscale: boolean;
}
export interface ITransformUrlPayload {
    /** File extension */
    ext: string;
    mimeType: string;
    /** File original ID */
    id: string;
    /** Image transform options */
    transform: IImageTransform;
    /** Image remote URL */
    url?: string;
}
export interface IImgeData {
    payload: ITransformUrlPayload;
    token: string;
}
export interface IFilePayload {
    filename: string;
    mimeType: string;
    encoding: string;
    capacitor: WriteStream;
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
    limits?: Partial<IUploadLimits>;
}
