/// <reference types="node" />
import { ReadStream } from 'fs';
import { IListResponse, TOutputFilter } from '@via-profit-services/core';
import { IFileBag, IFileBagTableInput, FileType, IImageTransform, IImgeData, Context, IRedisFileValue, IFileParams, IUploadFileInput, ITemporaryFileBag } from './types';
interface IProps {
    context: Context;
}
declare class FileStorageService {
    props: IProps;
    constructor(props: IProps);
    clearExpiredCacheFiles(): Promise<void>;
    clearExpiredTemporaryFiles(): Promise<void>;
    clearCache(): Promise<void>;
    clearTemporary(): Promise<void>;
    checkFileInCache(imageDataHash: string): Promise<IRedisFileValue>;
    makeImageCache(imageData: IImgeData, imageBuffer: Buffer): Promise<void>;
    compilePayloadCache(id: string, filename: string): string;
    getUrlWithTransform(imageData: Pick<IFileBag, 'id' | 'url' | 'mimeType' | 'isLocalFile'>, transform: IImageTransform): Promise<string>;
    /**
     * Returns Full filename without extension (e.g. /path/to/file)
     */
    static getPathFromUuid(guid: string): string;
    static resolveFile(filedata: Pick<IFileBag, 'id' | 'url' | 'mimeType' | 'isLocalFile'>): {
        resolveAbsolutePath: string;
        resolvePath: string;
    };
    applyTransform(filepath: string, transform: IImageTransform): Promise<void>;
    /**
     * Returns filename at static prefix root (e.g. /static/path/to/file.ext)
     */
    static getFilenameFromUuid(guid: string, delimiter?: string): string;
    static getStoragePath(): {
        storagePath: string;
        storageAbsolutePath: string;
    };
    static getCachePath(): {
        cachePath: string;
        cacheAbsolutePath: string;
    };
    static getTemporaryPath(): {
        temporaryPath: string;
        temporaryAbsolutePath: string;
    };
    static getFileTypeByMimeType(mimeType: string): FileType;
    /**
     * Resolve extension by mimeType or return default `txt` extension
     */
    static getExtensionByMimeType(mimeType: string): string;
    /**
     * Resolve mimeType by mime database or return default `text/plain` mimeType
     */
    static getMimeTypeByExtension(extension: string): string;
    /**
     * Extract file extension
     */
    static extractExtensionFromFilename(filename: string): string;
    /**
     * Extract file extension and try to resolve mimeType by mime database
     */
    static getMimeTypeByFilename(filename: string): string;
    /**
     * Resolve mimeType. \
     * You may pass invalid mimeType but valid filename with extension \
     * This method should return valid mimeType \
     * \
     * `Note:` On Linux OS the file Manager can pass invalid mime types \
     * when uploading files to the server
     */
    static resolveMimeType(filename: string, mimeType: string): string;
    getTemporaryFile(id: string): Promise<ITemporaryFileBag | false>;
    getFiles(filter: Partial<TOutputFilter>): Promise<IListResponse<IFileBag>>;
    getFilesByIds(ids: string[]): Promise<IFileBag[]>;
    getFile(id: string): Promise<IFileBag | false>;
    updateFile(id: string, fileData: Partial<IFileBagTableInput>): Promise<void>;
    createTemporaryFile(fileStream: ReadStream, fileInfo: IUploadFileInput): Promise<{
        id: string;
        absoluteFilename: string;
    }>;
    createFile(fileStream: ReadStream, fileInfo: IFileBagTableInput, fileParams?: IFileParams): Promise<{
        id: string;
        absoluteFilename: string;
    }>;
    moveFileFromTemporary(id: string): Promise<false | {
        id: string;
        absoluteFilename: string;
    }>;
    deleteStaticFiles(ids: string[]): Promise<string[]>;
}
export default FileStorageService;
export { FileStorageService };
