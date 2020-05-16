/// <reference types="node" />
import { ReadStream } from 'fs';
import { IListResponse, TOutputFilter } from '@via-profit-services/core';
import { Context } from '../../context';
import { IFileBag, IFileBagTableInput, FileType, IImageTransform, IImgeData } from './types';
interface IProps {
    context: Context;
}
declare class FileStorageService {
    props: IProps;
    constructor(props: IProps);
    clearCache(): Promise<void>;
    checkFileInCache(imageDataHash: string): Promise<string>;
    saveImageIntoTheCache(imageData: IImgeData, imageBuffer: Buffer): Promise<void>;
    getUrlWithTransform(imageData: Pick<IFileBag, 'id' | 'url' | 'mimeType' | 'isLocalFile'>, transform: IImageTransform): string;
    getImageDataFromTransformUrl(transformUrl: string): IImgeData;
    /**
     * Returns Full filename without extension (e.g. /path/to/file)
     */
    static getPathFromUuid(guid: string): string;
    /**
     * Returns filename at static prefix root (e.g. /static/path/to/file.ext)
     */
    static getFilenameFromUuid(guid: string): string;
    static getFileTypeByMimeType(mimeType: string): FileType;
    static getExtensionByMimeType(mimeType: string): string;
    static getMimeTypeByExtension(extension: string): string;
    static extractExtensionFromFilename(filename: string): string;
    static getMimeTypeByFilename(filename: string): string;
    getFiles(filter: Partial<TOutputFilter>): Promise<IListResponse<IFileBag>>;
    getFilesByIds(ids: string[]): Promise<IFileBag[]>;
    getDriver(id: string): Promise<IFileBag | false>;
    updateFile(id: string, fileData: Partial<IFileBagTableInput>): Promise<void>;
    createFile(fileStream: ReadStream, fileInfo: IFileBagTableInput, noCompress?: boolean): Promise<{
        id: string;
        absoluteFilename: string;
    }>;
    deleteFiles(ids: string[]): Promise<string[]>;
}
export default FileStorageService;
export { FileStorageService };
