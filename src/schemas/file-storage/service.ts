/* eslint-disable import/max-dependencies */
/* eslint-disable class-methods-use-this */
import fs, { ReadStream } from 'fs';
import path from 'path';
import {
  IListResponse,
  TOutputFilter,
  convertOrderByToKnex,
  convertWhereToKnex,
  TWhereAction,
  ServerError,
} from '@via-profit-services/core';
import imagemin from 'imagemin';
import imageminMozjpeg from 'imagemin-mozjpeg';
import imageminOptipng from 'imagemin-optipng';
import imageminPngquant from 'imagemin-pngquant';
import Jimp from 'jimp';
import mime from 'mime-types';
import moment from 'moment-timezone';
import rimraf from 'rimraf';
import { v4 as uuidv4 } from 'uuid';

import { REDIS_CACHE_NAME } from './constants';
import { getParams } from './paramsBuffer';
import {
  IFileBag, IFileBagTable, IFileBagTableInput, FileType, IImageTransform, ITransformUrlPayload,
  IImgeData, Context, ExtendedContext,
} from './types';

interface IProps {
  context: Context;
}

class FileStorageService {
  public props: IProps;

  public constructor(props: IProps) {
    this.props = props;
  }

  public async clearCache() {
    const { cacheAbsolutePath, rootPath } = getParams();
    const { redis, logger } = this.props.context as ExtendedContext;

    if (cacheAbsolutePath !== rootPath && fs.existsSync(cacheAbsolutePath)) {
      // clear Redis data
      await redis.del(REDIS_CACHE_NAME);

      // remove cache dir
      rimraf(`${cacheAbsolutePath}/*`, (err) => {
        if (err) {
          logger.fileStorage.error('Failed to remove cache directory', { err });
        }
      });

      logger.fileStorage.info(`Cache was cleared in «${cacheAbsolutePath}»`);
    }
  }

  public async checkFileInCache(imageDataHash: string) {
    const { redis } = this.props.context;
    const res = await redis.hget(REDIS_CACHE_NAME, imageDataHash);
    return res;
  }

  public async saveImageIntoTheCache(imageData: IImgeData, imageBuffer: Buffer) {
    const { redis } = this.props.context;
    const { payload, token } = imageData;
    const { cacheAbsolutePath } = getParams();

    const filename = FileStorageService.getPathFromUuid(uuidv4());
    const pathToSave = path.join(cacheAbsolutePath, filename);
    const absoluteFilename = `${pathToSave}.${payload.ext}`;
    const dirname = path.dirname(pathToSave);


    if (!fs.existsSync(dirname)) {
      fs.mkdirSync(dirname, { recursive: true });
    }
    fs.writeFileSync(absoluteFilename, imageBuffer);
    await redis.hset(REDIS_CACHE_NAME, token, absoluteFilename);
  }

  public async getUrlWithTransform(
    imageData: Pick<IFileBag, 'id' | 'url' | 'mimeType' | 'isLocalFile'>,
    transform: IImageTransform,
  ) {
    const { redis } = this.props.context;
    const {
      hostname, cacheDelimiter, staticPrefix, cacheAbsolutePath, storageAbsolutePath,
    } = getParams();
    const {
      url, id, mimeType, isLocalFile,
    } = imageData;

    const ext = FileStorageService.getExtensionByMimeType(mimeType);

    const hashPayload: ITransformUrlPayload = {
      id,
      ext,
      mimeType,
      transform,
    };

    if (!isLocalFile) {
      hashPayload.url = url;
    }


    const imageUrlHash = Buffer.from(JSON.stringify(hashPayload), 'utf8').toString('base64');

    // check redis cache
    const inCache = await redis.hget(REDIS_CACHE_NAME, imageUrlHash);


    if (inCache) {
      return [
        `${hostname}${staticPrefix}`,
        cacheDelimiter,
        `${inCache}`,
      ].join('/');
    }

    const originalFilename = `${FileStorageService.getPathFromUuid(id)}.${ext}`;
    const newFilename = `${FileStorageService.getPathFromUuid(uuidv4())}.${ext}`;
    const absoluteOriginalFilename = path.join(storageAbsolutePath, originalFilename);
    const absoluteFilename = path.join(cacheAbsolutePath, newFilename);
    const dirname = path.dirname(absoluteFilename);


    if (!fs.existsSync(dirname)) {
      fs.mkdirSync(dirname, { recursive: true });
    }


    // no wait this promise
    this.applyTransform(absoluteOriginalFilename, absoluteFilename, transform);

    await redis.hset(REDIS_CACHE_NAME, imageUrlHash, newFilename);


    return [
      `${hostname}${staticPrefix}`,
      cacheDelimiter,
      `${newFilename}`,
    ].join('/');
  }

  /**
   * Returns Full filename without extension (e.g. /path/to/file)
   */
  public static getPathFromUuid(guid: string): string {
    return [
      guid.substr(0, 2),
      guid.substr(2, 2),
      guid.substr(4),
    ].join('/');
  }

  public async applyTransform(
    sourceFilepath: string, destinationFilePath: string, transform: IImageTransform,
  ) {
    let jimpHandle = await Jimp.read(sourceFilepath);

    Object.entries(transform).forEach(([method, options]) => {
      if (method === 'resize') {
        const { width, height } = options as IImageTransform['resize'];
        jimpHandle = jimpHandle.resize(width, height);
      }

      if (method === 'cover') {
        const { width, height } = options as IImageTransform['cover'];
        jimpHandle = jimpHandle.cover(width, height);
      }

      if (method === 'contain') {
        const { width, height } = options as IImageTransform['contain'];
        jimpHandle = jimpHandle.contain(width, height);
      }

      if (method === 'scaleToFit') {
        const { width, height } = options as IImageTransform['scaleToFit'];
        jimpHandle = jimpHandle.scaleToFit(width, height);
      }

      if (method === 'gaussian') {
        const gaussian = options as IImageTransform['gaussian'];
        jimpHandle = jimpHandle.gaussian(gaussian);
      }

      if (method === 'blur') {
        const blur = options as IImageTransform['blur'];
        jimpHandle = jimpHandle.gaussian(blur);
      }

      if (method === 'greyscale') {
        const greyscale = options as IImageTransform['greyscale'];
        if (greyscale === true) {
          jimpHandle = jimpHandle.grayscale();
        }
      }
    });

    await jimpHandle.writeAsync(destinationFilePath);
  }

  /**
   * Returns filename at static prefix root (e.g. /static/path/to/file.ext)
   */
  public static getFilenameFromUuid(guid: string) {
    const { storagePath } = getParams();
    const localPath = FileStorageService.getPathFromUuid(guid);
    return path.join('/', storagePath, localPath);
  }


  public static getFileTypeByMimeType(mimeType: string): FileType {
    switch (mimeType) {
      case 'image/tiff':
      case 'image/png':
      case 'image/jpeg':
      case 'image/gif':
      case 'image/svg':
        return FileType.image;
      default:
        return FileType.document;
    }
  }

  public static getExtensionByMimeType(mimeType: string) {
    return mime.extension(mimeType) || 'txt';
  }

  public static getMimeTypeByExtension(extension: string) {
    return mime.lookup(extension) || 'text/plain';
  }

  public static extractExtensionFromFilename(filename: string) {
    return filename.split('.').pop();
  }

  public static getMimeTypeByFilename(filename: string) {
    const ext = FileStorageService.extractExtensionFromFilename(filename);
    return FileStorageService.getMimeTypeByExtension(ext);
  }

  public async getFiles(filter: Partial<TOutputFilter>): Promise<IListResponse<IFileBag>> {
    const { context } = this.props;
    const { knex } = context;
    const {
      staticPrefix, hostname, staticDelimiter,
    } = getParams();
    const {
      limit, offset, orderBy, where,
    } = filter;
    const dbResponse = await knex
      .select([
        '*',
        knex.raw('count(*) over() as "totalCount"'),
      ])
      .orderBy(convertOrderByToKnex(orderBy))
      .from<any, IFileBagTable[]>('fileStorage')
      .limit(limit || 1)
      .offset(offset || 0)
      .where((builder) => convertWhereToKnex(builder, where))
      .orderBy(convertOrderByToKnex(orderBy))
      .then((nodes) => ({
        totalCount: nodes.length ? Number(nodes[0].totalCount) : 0,
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        nodes: nodes.map(({ totalCount, url, ...nodeData }) => {
          return {
            ...nodeData,
            url: nodeData.isLocalFile
              ? `${hostname}${staticPrefix}/${staticDelimiter}/${url}`
              : url,
          };
        }),
      }));

    const { totalCount, nodes } = dbResponse;

    return {
      totalCount,
      nodes,
      where,
      orderBy,
      limit,
      offset,
    };
  }

  public async getFilesByIds(ids: string[]): Promise<IFileBag[]> {
    const { nodes } = await this.getFiles({
      where: [['id', TWhereAction.IN, ids]],
      offset: 0,
      limit: ids.length,
    });

    return nodes;
  }

  public async getDriver(id: string): Promise<IFileBag | false> {
    const nodes = await this.getFilesByIds([id]);
    return nodes.length ? nodes[0] : false;
  }

  public async updateFile(id: string, fileData: Partial<IFileBagTableInput>) {
    const { knex, timezone } = this.props.context;

    await knex<IFileBagTableInput>('fileStorage')
      .update({
        ...fileData,
        updatedAt: moment.tz(timezone).format(),
      })
      .where('id', id);
  }

  public async createFile(
    fileStream: ReadStream,
    fileInfo: IFileBagTableInput,
    noCompress?: boolean,
  ): Promise<{id: string; absoluteFilename: string; }> {
    const { knex, timezone } = this.props.context;
    const { storageAbsolutePath, compressionOptions } = getParams();

    const id = fileInfo.id || uuidv4();
    const ext = FileStorageService.getExtensionByMimeType(fileInfo.mimeType);
    const localFilename = `${FileStorageService.getPathFromUuid(id)}.${ext}`;

    const url = fileInfo.url || localFilename;
    const result = await knex<IFileBagTableInput>('fileStorage')
      .insert({
        isLocalFile: true,
        id,
        url,
        type: FileStorageService.getFileTypeByMimeType(fileInfo.mimeType),
        ...fileInfo,
        createdAt: moment.tz(timezone).format(),
        updatedAt: moment.tz(timezone).format(),
      })
      .returning('id');

    const newId = result[0];
    if (!newId) {
      throw new ServerError('Failed to register file in Database');
    }

    const absoluteFilename = path.join(storageAbsolutePath, localFilename);
    const dirname = path.dirname(absoluteFilename);


    return new Promise((resolve) => {
      if (!fs.existsSync(dirname)) {
        fs.mkdirSync(dirname, { recursive: true });
      }

      fileStream
        .pipe(fs.createWriteStream(absoluteFilename))
        .on('close', () => {
          if (['image/png', 'image/jpeg'].includes(fileInfo.mimeType)) {
            const { imageOptimMaxWidth, imageOptimMaxHeight } = getParams();
            Jimp.read(absoluteFilename)
              .then((image) => {
                return image.scaleToFit(imageOptimMaxWidth, imageOptimMaxHeight);
              })
              .then((image) => {
                return image.writeAsync(absoluteFilename);
              })
              .then(() => {
                if (noCompress) {
                  return;
                }

                // do not wait this promise
                imagemin([absoluteFilename], {
                  plugins: [
                    imageminMozjpeg(compressionOptions.mozJpeg),
                    imageminPngquant(compressionOptions.pngQuant),
                    imageminOptipng(compressionOptions.optiPng),
                  ],
                }).then((optiRes) => {
                  const { data } = optiRes[0];
                  fs.writeFileSync(absoluteFilename, data);
                });
              })
              .then(() => {
                return resolve({
                  id: newId,
                  absoluteFilename,
                });
              });
          } else {
            resolve({
              id: newId,
              absoluteFilename,
            });
          }
        });
    });
  }


  public async deleteFiles(ids: string[]): Promise<string[]> {
    const { knex } = this.props.context;
    const filesList = await this.getFilesByIds(ids);

    if (filesList.length) {
      filesList.forEach((fileData) => {
        // if is local file
        if (fileData.isLocalFile || fileData.url.match(/^\/[a-z0-9]+/i)) {
          const filename = FileStorageService.getFilenameFromUuid(fileData.id);
          const fullFilenamePath = path.resolve(filename);
          const dirname = path.dirname(filename);
          const dirnamePrev = path.resolve(dirname, '..');

          try {
            // remove file
            if (fs.existsSync(fullFilenamePath)) {
              fs.unlinkSync(fullFilenamePath);
            }

            // remove directory if is empty
            if (fs.readdirSync(dirname).length) {
              fs.unlinkSync(dirname);
            }

            // remove subdirectory if is empty
            if (fs.readdirSync(dirnamePrev).length) {
              fs.unlinkSync(dirnamePrev);
            }
          } catch (err) {
            throw new ServerError(`
              Failed to delete file ${fileData.id} in path ${fullFilenamePath}`, { err });
          }
        }
      });
    }


    const results = await knex('fileStorage')
      .del()
      .whereIn('id', ids)
      .returning('id');

    return results;
  }
}


export default FileStorageService;
export { FileStorageService };
