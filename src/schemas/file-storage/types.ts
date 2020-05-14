import { Options as ImagenimMozjpegOption } from 'imagemin-mozjpeg';
import { Options as ImagenimOptiPngOption } from 'imagemin-optipng';
import { Options as ImagenimPngQuantOption } from 'imagemin-pngquant';

export enum FileType {
  image = 'image',
  document = 'document',
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
  /** Prefix path (e.g. `/static`) @see https://expressjs.com/ru/starter/static-files.html */
  staticPrefix: string;

  /** Static `relative` path (e.g. `/public`). Do not set absolute path! @see https://expressjs.com/ru/starter/static-files.html */
  storagePath: string;

  /** Host or hostname without protocol ang schema (`www.example.com`) */
  host: string;

  /** (http or https) If is true then full URL address will be `https://www.example.com` */
  ssl?: boolean;

  /** Image maximum width */
  imageOptimMaxWidth: number;

  /** Image maximum height */
  imageOptimMaxHeight: number;

  compressionOptions?: {
    mozJpeg?: ImagenimMozjpegOption;
    pngQuant?: ImagenimPngQuantOption;
    optiPng?: ImagenimOptiPngOption;
  }
}


export type IFileStorageParams = IFileStorageInitialProps & {
  staticPrefixAbsolutePath: string;
  storageAbsolutePath: string;
  rootPath: string;


  /** URL delimeter of static content */
  staticDelimiter: string;

  /** URL delimiter for transform content */
  transformDelimiter: string;
}


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
