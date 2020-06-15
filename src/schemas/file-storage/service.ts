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
// import imagemin from 'imagemin';
// import imageminMozjpeg from 'imagemin-mozjpeg';
// import imageminOptipng from 'imagemin-optipng';
// import imageminPngquant from 'imagemin-pngquant';
import Jimp from 'jimp';
import mime from 'mime-types';
import moment from 'moment-timezone';
import rimraf from 'rimraf';
import { v4 as uuidv4 } from 'uuid';

import {
  REDIS_CACHE_NAME,
  TEMPORARY_FILE_EXPIRED_AT_MLSEC,
  IMAGE_TRANSFORM_MAX_BLUR,
  IMAGE_TRANSFORM_MAX_GAUSSIAN,
  IMAGE_TRANSFORM_MAX_HEIGHT,
  IMAGE_TRANSFORM_MAX_WITH,
} from './constants';
import { getParams } from './paramsBuffer';
import {
  IFileBag, IFileBagTable, IFileBagTableInput, FileType, IImageTransform, ITransformUrlPayload,
  IImgeData, Context, ExtendedContext, IRedisFileValue,
} from './types';
import { FileStorage } from '.';

interface IProps {
  context: Context;
}

class FileStorageService {
  public props: IProps;

  public constructor(props: IProps) {
    this.props = props;
  }

  public async clearExpiredCacheFiles() {
    const { cacheAbsolutePath } = getParams();
    const { redis, logger } = this.props.context as ExtendedContext;

    const counter = {
      allFiles: 0,
      deletedFiles: 0,
    };
    const allFiles = await redis.hgetall(REDIS_CACHE_NAME);
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    Object.entries(allFiles).forEach(async ([hash, payloadStr]) => {
      let payload: IRedisFileValue;
      counter.allFiles += 1;

      try {
        payload = JSON.parse(payloadStr) as IRedisFileValue;
      } catch (err) {
        logger.fileStorage.error('Cache clean. Failed to decode transform JSON', { err });
      }

      try {
        const { exp, filename } = payload;
        if (new Date().getTime() > exp) {
          const fullFilenamePath = path.resolve(cacheAbsolutePath, filename);
          const dirname = path.dirname(fullFilenamePath);
          const dirnamePrev = path.resolve(dirname, '..');
          if (fs.existsSync(fullFilenamePath)) {
            // remove file from fs
            fs.unlinkSync(fullFilenamePath);

            // remove file from redis
            redis.hdel(REDIS_CACHE_NAME, hash);

            counter.deletedFiles += 1;

            // remove directory if is empty
            if (!fs.readdirSync(dirname).length) {
              fs.rmdirSync(dirname);
            }

            // remove subdirectory if is empty
            if (!fs.readdirSync(dirnamePrev).length) {
              fs.rmdirSync(dirnamePrev);
            }
          }
        }
      } catch (err) {
        logger.fileStorage.error('Cache clean. Failed to delete cache file', { err });
      }
    });

    if (counter.allFiles > 0) {
      logger.fileStorage.info(`Cache clean. Deleted ${counter.deletedFiles} from ${counter.allFiles}`);
    } else {
      logger.fileStorage.info('Cache clean. There are no files to delete');
    }
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

  public async clearTemporary() {
    const { logger } = this.props.context as ExtendedContext;
    const { temporaryAbsolutePath, rootPath } = getParams();
    if (temporaryAbsolutePath !== rootPath && fs.existsSync(temporaryAbsolutePath)) {
      // remove cache dir
      rimraf(`${temporaryAbsolutePath}/*`, (err) => {
        if (err) {
          logger.fileStorage.error('Failed to remove cache directory', { err });
        }
      });

      logger.fileStorage.info(`Cache was cleared in «${temporaryAbsolutePath}»`);
    }
  }


  public async checkFileInCache(imageDataHash: string) {
    const { redis, logger } = this.props.context as ExtendedContext;
    const res = await redis.hget(REDIS_CACHE_NAME, imageDataHash);

    if (res) {
      try {
        const payload = JSON.parse(res) as IRedisFileValue;
        return payload;
      } catch (err) {
        logger.fileStorage.error('Failed to parse payload', { err, imageDataHash });
        return null;
      }
    }
    return null;
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
    await redis.hset(
      REDIS_CACHE_NAME,
      token,
      this.compilePayloadString(payload.id, absoluteFilename),
    );
  }


  public compilePayloadString(id: string, filename: string) {
    const { cacheTTL } = getParams();
    const exp = (new Date().getTime() + (cacheTTL * 1000));
    const payload: IRedisFileValue = {
      id,
      filename,
      exp,
    };

    return JSON.stringify(payload);
  }

  public async getUrlWithTransform(
    imageData: Pick<IFileBag, 'id' | 'url' | 'mimeType' | 'isLocalFile'>,
    transform: IImageTransform,
  ) {
    const { redis, logger } = this.props.context as ExtendedContext;
    const {
      hostname, cacheDelimiter, staticPrefix, cacheAbsolutePath, storageAbsolutePath,
    } = getParams();
    const {
      url,
      id,
      mimeType,
      isLocalFile,
    } = imageData;

    const ext = FileStorageService.getExtensionByMimeType(mimeType);

    const hashPayload: ITransformUrlPayload = {
      id,
      ext,
      transform,
    };

    if (!isLocalFile) {
      return url;
    }


    const imageUrlHash = Buffer.from(JSON.stringify(hashPayload), 'utf8').toString('base64');

    // check redis cache
    const inCache = await this.checkFileInCache(imageUrlHash);

    if (inCache) {
      return [
        `${hostname}${staticPrefix}`,
        cacheDelimiter,
        `${inCache.filename}`,
      ].join('/');
    }

    const originalFilename = `${FileStorageService.getPathFromUuid(id)}.${ext}`;
    const newFilename = `${FileStorageService.getPathFromUuid(uuidv4())}.${ext}`;
    const absoluteOriginalFilename = path.join(storageAbsolutePath, originalFilename);
    const absoluteFilename = path.join(cacheAbsolutePath, newFilename);
    const dirname = path.dirname(absoluteFilename);

    if (!fs.existsSync(absoluteOriginalFilename)) {
      throw new ServerError(`File ${originalFilename} with id ${id} not exists`);
    }

    if (!fs.existsSync(dirname)) {
      fs.mkdirSync(dirname, { recursive: true });
    }

    // copy file for transform operation
    fs.copyFileSync(absoluteOriginalFilename, absoluteFilename);
    redis.hset(REDIS_CACHE_NAME, imageUrlHash, this.compilePayloadString(id, newFilename));

    try {
      this.applyTransform(absoluteFilename, transform);
    } catch (err) {
      logger.fileStorage.error(`Failed to apply transformation with file ${newFilename}`, { err, transform });
    }
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
      guid,
    ].join('/');
  }

  public static resolveFile(filedata: Pick<IFileBag, 'id' | 'url' | 'mimeType' | 'isLocalFile'>) {
    const {
      mimeType, isLocalFile, url, id,
    } = filedata;
    if (!isLocalFile) {
      return {
        resolveAbsolutePath: url,
        resolvePath: url,
      };
    }

    const { storagePath, storageAbsolutePath } = getParams();
    const ext = FileStorage.getExtensionByMimeType(mimeType);
    const fileLocation = FileStorage.getPathFromUuid(id);
    return {
      resolvePath: path.join(storagePath, `${fileLocation}.${ext}`),
      resolveAbsolutePath: path.join(storageAbsolutePath, `${fileLocation}.${ext}`),
    };
  }

  public async applyTransform(filepath: string, transform: IImageTransform) {
    if (!fs.existsSync(filepath)) {
      const { logger } = this.props.context as ExtendedContext;
      logger.fileStorage.error(`Transform error. File «${filepath}» not found`);
      return;
    }

    if (!fs.readFileSync(filepath)) {
      const { logger } = this.props.context as ExtendedContext;
      logger.fileStorage.error(`Transform error. File «${filepath}» not readable`);
      return;
    }

    let jimpHandle = await Jimp.read(filepath);

    Object.entries(transform).forEach(([method, options]) => {
      if (method === 'resize') {
        const { w, h } = options as IImageTransform['resize'];
        jimpHandle = jimpHandle.resize(
          Math.min(w, IMAGE_TRANSFORM_MAX_WITH),
          Math.min(h, IMAGE_TRANSFORM_MAX_HEIGHT),
        );
      }

      if (method === 'cover') {
        const { w, h } = options as IImageTransform['cover'];
        jimpHandle = jimpHandle.cover(
          Math.min(w, IMAGE_TRANSFORM_MAX_WITH),
          Math.min(h, IMAGE_TRANSFORM_MAX_HEIGHT),
        );
      }

      if (method === 'contain') {
        const { w, h } = options as IImageTransform['contain'];
        jimpHandle = jimpHandle.contain(
          Math.min(w, IMAGE_TRANSFORM_MAX_WITH),
          Math.min(h, IMAGE_TRANSFORM_MAX_HEIGHT),
        );
      }

      if (method === 'scaleToFit') {
        const { w, h } = options as IImageTransform['scaleToFit'];
        jimpHandle = jimpHandle.scaleToFit(
          Math.min(w, IMAGE_TRANSFORM_MAX_WITH),
          Math.min(h, IMAGE_TRANSFORM_MAX_HEIGHT),
        );
      }

      if (method === 'gaussian') {
        const gaussian = options as IImageTransform['gaussian'];
        jimpHandle = jimpHandle.gaussian(
          Math.min(gaussian, IMAGE_TRANSFORM_MAX_GAUSSIAN),
        );
      }

      if (method === 'blur') {
        const blur = options as IImageTransform['blur'];
        jimpHandle = jimpHandle.blur(
          Math.min(blur, IMAGE_TRANSFORM_MAX_BLUR),
        );
      }

      if (method === 'greyscale') {
        const greyscale = options as IImageTransform['greyscale'];
        if (greyscale === true) {
          jimpHandle = jimpHandle.grayscale();
        }
      }

      if (method === 'crop') {
        const {
          w, h, x, y,
        } = options as IImageTransform['crop'];
        jimpHandle = jimpHandle.crop(
          Math.min(x, IMAGE_TRANSFORM_MAX_WITH),
          Math.min(y, IMAGE_TRANSFORM_MAX_HEIGHT),
          Math.min(w, IMAGE_TRANSFORM_MAX_WITH),
          Math.min(h, IMAGE_TRANSFORM_MAX_HEIGHT),
        );
      }
    });
    await jimpHandle.writeAsync(filepath);
  }

  /**
   * Returns filename at static prefix root (e.g. /static/path/to/file.ext)
   */
  public static getFilenameFromUuid(guid: string, delimiter = 's') {
    const {
      storagePath, cachePath, temporaryPath, staticDelimiter, cacheDelimiter, temporaryDelimiter,
    } = getParams();
    const localPath = FileStorageService.getPathFromUuid(guid);

    switch (delimiter) {
      case cacheDelimiter:
        return path.join('/', cachePath, localPath);

      case temporaryDelimiter:
        return path.join('/', temporaryPath, localPath);

      case staticDelimiter:
      default:
        return path.join('/', storagePath, localPath);
    }
  }

  public static getStoragePath() {
    const { storagePath, storageAbsolutePath } = getParams();
    return {
      storagePath,
      storageAbsolutePath,
    };
  }

  public static getCachePath() {
    const { cachePath, cacheAbsolutePath } = getParams();
    return {
      cachePath,
      cacheAbsolutePath,
    };
  }

  public static getTemporaryPath() {
    const { temporaryPath, temporaryAbsolutePath } = getParams();
    return {
      temporaryPath,
      temporaryAbsolutePath,
    };
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

  public async getFile(id: string): Promise<IFileBag | false> {
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


  public async getTemporaryFileStream(
    fileInfo: {
      id?: string;
      mimeType: string;
      expireAt?: number,
    },
  ) {
    const { timezone } = this.props.context as ExtendedContext;
    const id = fileInfo.id || uuidv4();
    const { mimeType, expireAt } = fileInfo;
    const {
      temporaryAbsolutePath, hostname, temporaryDelimiter, staticPrefix,
    } = getParams();
    const ext = FileStorageService.getExtensionByMimeType(mimeType);
    const localFilename = `${FileStorageService.getPathFromUuid(id)}.${ext}`;

    const absoluteFilename = path.join(temporaryAbsolutePath, localFilename);
    const dirname = path.dirname(absoluteFilename);

    if (!fs.existsSync(dirname)) {
      fs.mkdirSync(dirname, { recursive: true });
    }

    const url = `${hostname}${staticPrefix}/${temporaryDelimiter}/${localFilename}`;

    const stream = fs.createWriteStream(absoluteFilename);

    setTimeout(() => {
      const dirnamePrev = path.resolve(dirname, '..');

      try {
        // remove file
        if (fs.existsSync(absoluteFilename)) {
          fs.unlinkSync(absoluteFilename);
        }

        // remove directory if is empty
        if (!fs.readdirSync(dirname).length) {
          fs.rmdirSync(dirname);
        }

        // remove subdirectory if is empty
        if (!fs.readdirSync(dirnamePrev).length) {
          fs.rmdirSync(dirnamePrev);
        }
      } catch (err) {
        throw new ServerError(`
          Failed to delete file ${id} in path ${absoluteFilename}`,
        { err });
      }
    }, expireAt || TEMPORARY_FILE_EXPIRED_AT_MLSEC);

    return {
      ext,
      url,
      stream,
      mimeType,
      absoluteFilename,
      expireAt: moment.tz(timezone).add(expireAt / 1000, 'seconds').toDate(),
    };
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
        try {
          fs.mkdirSync(dirname, { recursive: true });
        } catch (err) {
          throw new ServerError('Failed to create destination directory', { err });
        }
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
              // .then(async () => {
              //   if (noCompress) {
              //     return;
              //   }

              //   // do not wait this promise
              //   await imagemin([absoluteFilename],
              //     {
              //       plugins: [
              //         imageminMozjpeg(compressionOptions.mozJpeg),
              //         imageminPngquant(compressionOptions.pngQuant),
              //         imageminOptipng(compressionOptions.optiPng),
              //       ],
              //     }).then((optiRes) => {
              //     const { data } = optiRes[0];
              //     fs.writeFileSync(absoluteFilename, data);
              //   });
              // })
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


  public async deleteStaticFiles(ids: string[]): Promise<string[]> {
    const { knex } = this.props.context;
    const filesList = await this.getFilesByIds(ids);
    const { staticDelimiter, rootPath } = getParams();

    if (filesList.length) {
      filesList.forEach((fileData) => {
        // if is local file
        if (fileData.isLocalFile || fileData.url.match(/^\/[a-z0-9]+/i)) {
          const filename = FileStorage.getFilenameFromUuid(fileData.id, staticDelimiter);
          // const filename = FileStorageService.getFilenameFromUuid(fileData.id, staticDelimiter);
          const ext = FileStorage.getExtensionByMimeType(fileData.mimeType);
          const fullFilenamePath = path.resolve(rootPath, `${filename}.${ext}`);
          const dirname = path.dirname(filename);
          const dirnamePrev = path.resolve(dirname, '..');

          try {
            // remove file
            if (fs.existsSync(fullFilenamePath)) {
              fs.unlinkSync(fullFilenamePath);

              // remove directory if is empty
              if (!fs.readdirSync(dirname).length) {
                fs.rmdirSync(dirname);
              }

              // remove subdirectory if is empty
              if (!fs.readdirSync(dirnamePrev).length) {
                fs.rmdirSync(dirnamePrev);
              }
            }
          } catch (err) {
            throw new ServerError(`
              Failed to delete file ${fileData.id} in path ${fullFilenamePath}`,
            { err });
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
