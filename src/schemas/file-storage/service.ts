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
  REDIS_TEMPORARY_NAME,
  IMAGE_TRANSFORM_MAX_BLUR,
  IMAGE_TRANSFORM_MAX_GAUSSIAN,
  IMAGE_TRANSFORM_MAX_HEIGHT,
  IMAGE_TRANSFORM_MAX_WITH,
} from './constants';
import createLoaders from './loaders';
import { getParams } from './paramsBuffer';
import {
  IFileBag, IFileBagTable, IFileBagTableInput, FileType, IImageTransform, ITransformUrlPayload,
  IImgeData, Context, ExtendedContext, IRedisFileValue, IRedisTemporaryValue,
  IUploadFileInput, IFileBagCreate,
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

  public async clearExpiredTemporaryFiles() {
    const { temporaryAbsolutePath } = getParams();
    const { redis, logger } = this.props.context as ExtendedContext;

    const counter = {
      allFiles: 0,
      deletedFiles: 0,
    };
    const allFiles = await redis.hgetall(REDIS_TEMPORARY_NAME);
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    Object.entries(allFiles).forEach(async ([hash, payloadStr]) => {
      let payload: IRedisTemporaryValue;
      counter.allFiles += 1;

      try {
        payload = JSON.parse(payloadStr) as IRedisTemporaryValue;
      } catch (err) {
        logger.fileStorage.error('Cache clean. Failed to decode transform JSON', { err });
      }

      try {
        const { exp, filename } = payload;
        if (new Date().getTime() > exp) {
          const fullFilenamePath = path.resolve(temporaryAbsolutePath, filename);
          const dirname = path.dirname(fullFilenamePath);
          const dirnamePrev = path.resolve(dirname, '..');
          if (fs.existsSync(fullFilenamePath)) {
            // remove file from fs
            fs.unlinkSync(fullFilenamePath);

            // remove file from redis
            redis.hdel(REDIS_TEMPORARY_NAME, hash);

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
        logger.fileStorage.error('Temporary clean. Failed to delete temporary file', { err });
      }
    });

    if (counter.allFiles > 0) {
      logger.fileStorage.info(
        `Temporary clean. Deleted ${counter.deletedFiles} from ${counter.allFiles}`,
      );
    } else {
      logger.fileStorage.info('Temporary clean. There are no files to delete');
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


  public async checkFileInCache(imageDataHash: string): Promise<IRedisFileValue | null> {
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

  public async makeImageCache(imageData: IImgeData, imageBuffer: Buffer) {
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
      this.compilePayloadCache(payload.id, absoluteFilename),
    );
  }


  public compilePayloadCache(id: string, filename: string) {
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

    const type = FileStorageService.getFileTypeByMimeType(mimeType);
    const ext = FileStorageService.getExtensionByMimeType(mimeType);

    const hashPayload: ITransformUrlPayload = {
      id,
      ext,
      transform,
    };

    if (!isLocalFile || type !== FileType.image) {
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
    redis.hset(REDIS_CACHE_NAME, imageUrlHash, this.compilePayloadCache(id, newFilename));

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
          x, y, w, h,
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


  /**
   * Resolve extension by mimeType or return default `txt` extension
   */
  public static getExtensionByMimeType(mimeType: string) {
    return mime.extension(mimeType) || 'txt';
  }


  /**
   * Resolve mimeType by mime database or return default `text/plain` mimeType
   */
  public static getMimeTypeByExtension(extension: string) {
    return mime.lookup(extension) || 'text/plain';
  }

  /**
   * Extract file extension
   */
  public static extractExtensionFromFilename(filename: string) {
    return filename.split('.').pop();
  }

  /**
   * Extract file extension and try to resolve mimeType by mime database
   */
  public static getMimeTypeByFilename(filename: string) {
    const ext = FileStorageService.extractExtensionFromFilename(filename);
    return FileStorageService.getMimeTypeByExtension(ext);
  }

  /**
   * Resolve mimeType. \
   * You may pass invalid mimeType but valid filename with extension \
   * This method should return valid mimeType \
   * \
   * `Note:` On Linux OS the file Manager can pass invalid mime types \
   * when uploading files to the server
   */
  public static resolveMimeType(filename: string, mimeType: string) {
    const ext = FileStorageService.extractExtensionFromFilename(filename);
    const extFromMimeType = mime.extension(mimeType);

    if (ext === extFromMimeType) {
      return mimeType;
    }

    return FileStorageService.getMimeTypeByExtension(filename);
  }

  /**
   * Create WriteStream and reutn it with the file data/
   * File will be registered in common file store
   */
  public async getFileStream(fileInfo: IFileBagCreate): Promise<{
      stream: fs.WriteStream;
      file: IFileBag;
    }> {
    const { storageAbsolutePath } = getParams();
    const id = fileInfo.id || uuidv4();

    const filename = FileStorage.getPathFromUuid(id);
    const ext = FileStorage.getExtensionByMimeType(fileInfo.mimeType);
    const absoluteFilename = path.join(storageAbsolutePath, `${filename}.${ext}`);

    await this.createFile(null, fileInfo);
    const file = await this.getFile(id);

    if (!file) {
      throw new ServerError('Failed to create file stream');
    }

    const stream = fs.createWriteStream(absoluteFilename);

    return {
      stream,
      file,
    };
  }

  /**
   * Create WriteStream and reutn it with the file data/
   * File will be registered in temporary file store and will be deleted at `expireAt`
   */
  public async getTemporaryFileStream(fileInfo: {
    mimeType: string;
    id?: string;
    expireAt?: number,
    }): Promise<{
      stream: fs.WriteStream;
      file: IFileBag;
      expireAt: Date;
    }> {
    const { timezone } = this.props.context;
    const { temporaryAbsolutePath, temporaryTTL } = getParams();
    const id = fileInfo.id || uuidv4();

    const expireAt = fileInfo.expireAt || temporaryTTL;
    const filename = FileStorage.getPathFromUuid(id);
    const ext = FileStorage.getExtensionByMimeType(fileInfo.mimeType);
    const absoluteFilename = path.join(temporaryAbsolutePath, `${filename}.${ext}`);
    await this.createTemporaryFile(null, {
      id,
      isLocalFile: true,
      mimeType: fileInfo.mimeType,
      category: 'temporary',
      type: FileType.document,
      owner: uuidv4(),
    }, expireAt);
    const file = await this.getTemporaryFile(id);

    if (!file) {
      throw new ServerError('Failed to create temporary file stream');
    }

    const stream = fs.createWriteStream(absoluteFilename);

    return {
      stream,
      file,
      expireAt: moment.tz(timezone).add(expireAt, 'seconds').toDate(),
    };
  }

  public async getTemporaryFile(id: string): Promise<IFileBag | false> {
    const { redis, logger, timezone } = this.props.context as ExtendedContext;
    const {
      temporaryAbsolutePath, hostname, temporaryDelimiter, staticPrefix,
    } = getParams();
    const payloadStr = await redis.hget(REDIS_TEMPORARY_NAME, id);
    let payload: IRedisTemporaryValue;

    try {
      payload = JSON.parse(payloadStr) as IRedisTemporaryValue;
    } catch (err) {
      logger.fileStorage.error('Failed to decode temporary data JSON', { err });
    }

    const absoluteFilename = path.join(temporaryAbsolutePath, payload.filename);
    if (!fs.existsSync(absoluteFilename)) {
      return false;
    }

    const { fileInfo } = payload;
    return {
      id,
      createdAt: moment.tz(timezone).toDate(),
      updatedAt: moment.tz(timezone).toDate(),
      url: `${hostname}${staticPrefix}/${temporaryDelimiter}/${payload.filename}`,
      ...fileInfo,
    };
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

  public preparePayloadToSQL(fileData: Partial<IFileBag>): Partial<IFileBagTableInput> {
    const { timezone } = this.props.context;

    const {
      metaData, createdAt, updatedAt, ...otherFileData
    } = fileData;

    const retDataInput: Partial<IFileBagTableInput> = otherFileData;

    if (metaData) {
      retDataInput.metaData = JSON.stringify(metaData);
    }

    if (createdAt) {
      retDataInput.createdAt = moment.tz(createdAt, timezone).format();
    }

    if (updatedAt) {
      retDataInput.updatedAt = moment.tz(updatedAt, timezone).format();
    }

    return retDataInput;
  }

  public async updateFile(id: string, fileData: Partial<IFileBag>) {
    const { knex, timezone } = this.props.context;
    const result = await knex<IFileBagTableInput>('fileStorage')
      .update({
        ...this.preparePayloadToSQL(fileData),
        updatedAt: moment.tz(timezone).format(),
      })
      .where('id', id)
      .returning('id');
    return result;
  }


  public async createTemporaryFile(
    fileStream: ReadStream | null,
    fileInfo: IUploadFileInput,
    expireAt?: number,
  ): Promise<{id: string; absoluteFilename: string; }> {
    const { temporaryAbsolutePath, temporaryTTL } = getParams();
    const { redis } = this.props.context;

    const id = fileInfo.id || uuidv4();
    const ext = FileStorageService.getExtensionByMimeType(fileInfo.mimeType);
    const type = FileStorageService.getFileTypeByMimeType(fileInfo.mimeType);
    const filename = `${FileStorageService.getPathFromUuid(id)}.${ext}`;

    const absoluteFilename = path.join(temporaryAbsolutePath, filename);
    const dirname = path.dirname(absoluteFilename);
    const exp = (new Date().getTime() + ((expireAt || temporaryTTL) * 1000));
    const token = id;
    const payload: IRedisTemporaryValue = {
      id,
      filename,
      exp,
      fileInfo: {
        ...fileInfo,
        type,
      },
    };

    return new Promise((resolve) => {
      if (!fs.existsSync(dirname)) {
        try {
          fs.mkdirSync(dirname, { recursive: true });
        } catch (err) {
          throw new ServerError('Failed to create destination directory', { err });
        }
      }

      const wrStream = fs.createWriteStream(absoluteFilename);
      wrStream.on('close', async () => {
        await redis.hset(
          REDIS_TEMPORARY_NAME,
          token,
          JSON.stringify(payload),
        );
        resolve({
          id,
          absoluteFilename,
        });
      });
      if (fileStream) {
        fileStream.pipe(wrStream);
      } else {
        wrStream.end();
      }
    });
  }


  public async compressImage(absoluteFilename: string): Promise<void> {
    const { imageOptimMaxWidth, imageOptimMaxHeight } = getParams();

    const jimpHandle = await Jimp.read(absoluteFilename);
    if (
      jimpHandle.getWidth() > imageOptimMaxWidth
      || jimpHandle.getHeight() > imageOptimMaxHeight
    ) {
      jimpHandle.scaleToFit(imageOptimMaxWidth, imageOptimMaxHeight);
      jimpHandle.writeAsync(absoluteFilename);
    }
  }

  public async createFile(
    fileStream: ReadStream | null,
    fileInfo: IFileBagCreate,
  ): Promise<{id: string; absoluteFilename: string; }> {
    const { knex, timezone } = this.props.context;
    const {
      storageAbsolutePath,
    } = getParams();

    const id = fileInfo.id || uuidv4();
    const ext = FileStorageService.getExtensionByMimeType(fileInfo.mimeType);
    const localFilename = `${FileStorageService.getPathFromUuid(id)}.${ext}`;
    const url = (fileInfo.isLocalFile || !fileInfo.url) ? localFilename : fileInfo.url;

    try {
      await knex<IFileBagTableInput>('fileStorage')
        .insert({
          ...this.preparePayloadToSQL(fileInfo),
          id,
          url,
          type: FileStorageService.getFileTypeByMimeType(fileInfo.mimeType),
          createdAt: moment.tz(timezone).format(),
          updatedAt: moment.tz(timezone).format(),
        })
        .returning('id');
    } catch (err) {
      throw new ServerError('Failed to register file in Database', { err });
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

      const wrStream = fs.createWriteStream(absoluteFilename);
      wrStream.on('close', async () => {
        resolve({
          id,
          absoluteFilename,
        });
      });

      if (fileStream) {
        fileStream.pipe(wrStream);
      } else {
        wrStream.end();
      }
    });
  }

  public async moveFileFromTemporary(id: string) {
    const { temporaryAbsolutePath } = getParams();
    const payload = await this.getTemporaryFile(id);
    const filename = FileStorage.getPathFromUuid(id);
    if (!payload) {
      throw new ServerError(`File ${id} does not have in temporary cache`);
    }

    const ext = FileStorage.getExtensionByMimeType(payload.mimeType);
    const absoluteFilename = path.join(temporaryAbsolutePath, `${filename}.${ext}`);
    if (!fs.existsSync(absoluteFilename)) {
      throw new ServerError(`File ${id} not exists in path ${absoluteFilename}`);
    }

    const stream = fs.createReadStream(absoluteFilename);
    const fileData = await this.createFile(stream, {
      ...payload,
      isLocalFile: true,
    });

    return fileData;
  }

  public async deleteFilesByOwner(owner: string | string[]): Promise<string[] | false> {
    const { context } = this.props;
    const loader = createLoaders(context);
    const owners = Array.isArray(owner) ? owner : [owner];
    const files = await this.getFiles({
      where: [
        ['owner', TWhereAction.IN, owners],
      ],
    });
    const idsByOwner = files.nodes.map((node) => node.id);
    if (idsByOwner.length) {
      const deletedIds = await this.deleteStaticFiles(idsByOwner);
      deletedIds.forEach((deletedId) => {
        loader.files.clear(deletedId);
      });
      return deletedIds;
    }

    return false;
  }

  public async deleteStaticFiles(ids: string[]): Promise<string[]> {
    const { context } = this.props;
    const { knex } = context;
    const filesList = await this.getFilesByIds(ids);
    const { staticDelimiter, rootPath } = getParams();

    if (filesList.length) {
      filesList.forEach((fileData) => {
        // if is local file
        if (fileData.isLocalFile || fileData.url.match(/^\/[a-z0-9]+/i)) {
          const filename = FileStorage.getFilenameFromUuid(fileData.id, staticDelimiter);
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
