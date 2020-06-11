/// <reference types="node" />
import fs, { ReadStream } from 'fs';
import { IListResponse, TOutputFilter } from '@via-profit-services/core';
import { IFileBag, IFileBagTableInput, FileType, IImageTransform, IImgeData, Context } from './types';
interface IProps {
    context: Context;
}
declare class FileStorageService {
    props: IProps;
    constructor(props: IProps);
    clearCache(): Promise<void>;
    clearTemporary(): Promise<void>;
    checkFileInCache(imageDataHash: string): Promise<string>;
    saveImageIntoTheCache(imageData: IImgeData, imageBuffer: Buffer): Promise<void>;
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
    static getExtensionByMimeType(mimeType: string): string;
    static getMimeTypeByExtension(extension: string): string;
    static extractExtensionFromFilename(filename: string): string;
    static getMimeTypeByFilename(filename: string): string;
    getFiles(filter: Partial<TOutputFilter>): Promise<IListResponse<IFileBag>>;
    getFilesByIds(ids: string[]): Promise<IFileBag[]>;
    getFile(id: string): Promise<IFileBag | false>;
    updateFile(id: string, fileData: Partial<IFileBagTableInput>): Promise<void>;
    getTemporaryFileStream(fileInfo: {
        id?: string;
        mimeType: string;
        expireAt?: number;
    }): Promise<{
        ext: string;
        url: string;
        stream: fs.WriteStream;
        mimeType: string;
        absoluteFilename: string;
        expireAt: Date;
    }>;
    createFile(fileStream: ReadStream, fileInfo: IFileBagTableInput, noCompress?: boolean): Promise<{
        id: string;
        absoluteFilename: string;
    }>;
    deleteStaticFiles(ids: string[]): Promise<string[]>;
}
export default FileStorageService;
export { FileStorageService };
