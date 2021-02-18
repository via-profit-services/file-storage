/* eslint-disable import/max-dependencies */
import { ListResponse, OutputFilter, ServerError } from '@via-profit-services/core';
import type {
  FileBag, FileBagTable, FileBagTableInput, FileType, ImageTransform, TransformUrlPayload,
  ImgeData, RedisFileValue, RedisTemporaryValue, FileStorageServiceProps, FileStorageParams,
  UploadFileInput, FileBagCreate, TemporaryFileBag, CompressImageStats,
} from '@via-profit-services/file-storage';
import { convertOrderByToKnex, convertWhereToKnex, extractTotalCountPropOfNode } from '@via-profit-services/knex';
import fs, { ReadStream } from 'fs';
import imagemin from 'imagemin';
import imageminMozjpeg from 'imagemin-mozjpeg';
import imageminOptipng from 'imagemin-optipng';
import imageminPngquant from 'imagemin-pngquant';
import Jimp from 'jimp';
import mime from 'mime-types';
import moment from 'moment-timezone';
import path from 'path';
import { performance } from 'perf_hooks';
import { v4 as uuidv4 } from 'uuid';

import {
  REDIS_CACHE_NAME,
  REDIS_TEMPORARY_NAME,
  IMAGE_TRANSFORM_MAX_BLUR,
  IMAGE_TRANSFORM_MAX_GAUSSIAN,
  IMAGE_TRANSFORM_MAX_HEIGHT,
  IMAGE_TRANSFORM_MAX_WITH,
  CACHE_FILES_DEFAULT_TTL,
  TEMPORARY_FILES_DEFAULT_TTL,
  DEFAULT_IMAGE_OPTIM_MAX_WIDTH,
  DEFAULT_IMAGE_OPTIM_MAX_HEIGHT,
  DEFAULT_STORAGE_PATH,
  DEFAULT_CACHE_PATH,
  DEFAULT_TEMPORARY_PATH,
  DEFAULT_STATIC_PREFIX,
  CACHE_DELIMITER,
  STATIC_DELIMITER,
  TEMPORARY_DELIMITER,
  TIMEOUT_MAX_VALUE,
  DEFAULT_MAX_FIELD_SIZE,
  DEFAULT_MAX_FILES,
  DEFAULT_MAX_FILE_SIZE,
} from './constants';


class FileStorageService {
  public props: FileStorageParams;

  public constructor(props: FileStorageServiceProps) {
    const { configuration, context } = props;
    const { cacheTTL, temporaryTTL, compressionOptions, categories } = configuration;


    this.props = {
      categories: [...categories || []],
      context,
      cacheTTL: Math.min(
        TIMEOUT_MAX_VALUE / 1000, cacheTTL || CACHE_FILES_DEFAULT_TTL,
      ),
      temporaryTTL: Math.min(
        TIMEOUT_MAX_VALUE / 1000, temporaryTTL || TEMPORARY_FILES_DEFAULT_TTL,
      ),
      imageOptimMaxWidth: DEFAULT_IMAGE_OPTIM_MAX_WIDTH,
      imageOptimMaxHeight: DEFAULT_IMAGE_OPTIM_MAX_HEIGHT,
      hostname: '',
      storagePath: DEFAULT_STORAGE_PATH,
      cachePath: DEFAULT_CACHE_PATH,
      temporaryPath: DEFAULT_TEMPORARY_PATH,
      staticPrefix: DEFAULT_STATIC_PREFIX,
      maxFieldSize: DEFAULT_MAX_FIELD_SIZE,
      maxFileSize: DEFAULT_MAX_FILE_SIZE,
      maxFiles: DEFAULT_MAX_FILES,
      ...configuration,
      compressionOptions: {
        mozJpeg: {
          quality: 70,
          ...compressionOptions?.mozJpeg || {},
        },
        pngQuant: {
          quality: [0.8, 0.8],
          ...compressionOptions?.pngQuant || {},
        },
        optiPng: {
          optimizationLevel: 3,
          ...compressionOptions?.optiPng || {},
        },
      },
    };
  }

  public getProps () {
    return this.props;
  }

  public async clearExpiredCacheFiles() {
    const { context } = this.props;
    const { redis, logger } = context;
    const { cacheAbsolutePath } = this.getCachePath();

    const counter = {
      allFiles: 0,
      deletedFiles: 0,
    };
    const allFiles = await redis.hgetall(REDIS_CACHE_NAME);

    Object.entries(allFiles).forEach(async ([hash, payloadStr]) => {
      let payload: RedisFileValue;
      counter.allFiles += 1;

      try {
        payload = JSON.parse(payloadStr) as RedisFileValue;
      } catch (err) {
        logger.files.error('Cache clean. Failed to decode transform JSON', { err });
      }

      try {
        const { exp, filename } = payload;
        if (new Date().getTime() > exp) {
          const fullFilenamePath = path.join(cacheAbsolutePath, filename);
          const dirname = path.dirname(fullFilenamePath);

          if (fs.existsSync(fullFilenamePath)) {
            // remove file from fs
            fs.unlinkSync(fullFilenamePath);

            // remove file from redis
            redis.hdel(REDIS_CACHE_NAME, hash);

            counter.deletedFiles += 1;

            // remove directory if is empty
            this.removeEmptyDirectories(dirname);
          }
        }
      } catch (err) {
        logger.files.error('Cache clean. Failed to delete cache file', { err });
      }
    });

    if (counter.allFiles > 0) {
      logger.files.info(`Cache clean. Deleted ${counter.deletedFiles} from ${counter.allFiles}`);
    } else {
      logger.files.info('Cache clean. There are no files to delete');
    }
  }

  public async clearExpiredTemporaryFiles() {
    const { context } = this.props;
    const { redis, logger } = context;
    const { temporaryAbsolutePath } = this.getTemporaryPath();

    const counter = {
      allFiles: 0,
      deletedFiles: 0,
    };
    const allFiles = await redis.hgetall(REDIS_TEMPORARY_NAME);
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    Object.entries(allFiles).forEach(async ([hash, payloadStr]) => {
      let payload: RedisTemporaryValue;
      counter.allFiles += 1;

      try {
        payload = JSON.parse(payloadStr) as RedisTemporaryValue;
      } catch (err) {
        logger.files.error('Cache clean. Failed to decode transform JSON', { err });
      }

      try {
        const { exp, filename } = payload;
        if (new Date().getTime() > exp) {
          const fullFilenamePath = path.join(temporaryAbsolutePath, filename);
          const dirname = path.dirname(fullFilenamePath);
          if (fs.existsSync(fullFilenamePath)) {
            // remove file from fs
            fs.unlinkSync(fullFilenamePath);

            // remove file from redis
            redis.hdel(REDIS_TEMPORARY_NAME, hash);

            counter.deletedFiles += 1;

            // remove directory if is empty
            this.removeEmptyDirectories(dirname);
          }
        }
      } catch (err) {
        logger.files.error('Temporary clean. Failed to delete temporary file', { err });
      }
    });

    if (counter.allFiles > 0) {
      logger.files.info(
        `Temporary clean. Deleted ${counter.deletedFiles} from ${counter.allFiles}`,
      );
    } else {
      logger.files.info('Temporary clean. There are no files to delete');
    }
  }

  public async clearCache() {
    const { context } = this.props;
    const { redis, logger } = context;
    const { cacheAbsolutePath } = this.getCachePath();

    if (fs.existsSync(cacheAbsolutePath)) {
      // clear Redis data
      await redis.del(REDIS_CACHE_NAME);

      // remove cache dir
      try {
        fs.rmSync(cacheAbsolutePath, {
          force: true,
          recursive: true,
        });

        // remove empty directories
        this.removeEmptyDirectories(cacheAbsolutePath);

      } catch (err) {
        logger.files.error('Failed to remove cache directory', { err });
      }

      logger.files.info(`Cache was cleared in «${cacheAbsolutePath}»`);
    }
  }

  public async clearTemporary() {
    const { context } = this.props;
    const { logger } = context;

    const { temporaryAbsolutePath } = this.getTemporaryPath();

    if (fs.existsSync(temporaryAbsolutePath)) {
      try {
        fs.rmSync('temporaryAbsolutePath', {
          recursive: true,
          force: true,
        });
      } catch (err) {
        logger.files.error('Failed to remove cache directory', { err });
      }

      this.removeEmptyDirectories(temporaryAbsolutePath);

      logger.files.info(`Cache was cleared in «${temporaryAbsolutePath}»`);
    }
  }


  public async checkFileInCache(imageDataHash: string): Promise<RedisFileValue | null> {
    const { context } = this.props;
    const { redis, logger } = context;
    const res = await redis.hget(REDIS_CACHE_NAME, imageDataHash);

    if (res) {
      try {
        const payload = JSON.parse(res) as RedisFileValue;

        return payload;
      } catch (err) {
        logger.files.error('Failed to parse payload', { err, imageDataHash });

        return null;
      }
    }

    return null;
  }

  public async makeImageCache(imageData: ImgeData, imageBuffer: Buffer) {
    const { context } = this.props;
    const { redis } = context;
    const { payload, token } = imageData;
    const { cacheAbsolutePath } = this.getCachePath();

    const filename = this.getPathFromUuid(uuidv4());
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
    const { cacheTTL } = this.props;
    const exp = (new Date().getTime() + (cacheTTL * 1000));
    const payload: RedisFileValue = {
      id,
      filename,
      exp,
    };

    return JSON.stringify(payload);
  }

  public async getUrlWithTransform(
    imageData: Pick<FileBag, 'id' | 'url' | 'mimeType' | 'isLocalFile'>,
    transform: ImageTransform,
  ) {
    const { context, hostname, staticPrefix } = this.props;
    const { redis } = context;
    const { url, id, mimeType, isLocalFile } = imageData;
    const { storageAbsolutePath } = this.getStoragePath();
    const { cacheAbsolutePath } = this.getCachePath();

    const type = this.getFileTypeByMimeType(mimeType);
    const ext = this.getExtensionByMimeType(mimeType);

    const hashPayload: TransformUrlPayload = {
      id,
      ext,
      transform,
    };

    if (!isLocalFile || type !== 'image') {
      return url;
    }


    const imageUrlHash = Buffer.from(JSON.stringify(hashPayload), 'utf8').toString('base64');

    // check redis cache
    const inCache = await this.checkFileInCache(imageUrlHash);

    if (inCache) {
      return [
        `${hostname}${staticPrefix}`,
        CACHE_DELIMITER,
        `${inCache.filename}`,
      ].join('/');
    }

    const originalFilename = `${this.getPathFromUuid(id)}.${ext}`;
    const newFilename = `${this.getPathFromUuid(uuidv4())}.${ext}`;
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

    this.applyTransform(absoluteFilename, transform);

    return [
      `${hostname}${staticPrefix}`,
      CACHE_DELIMITER,
      `${newFilename}`,
    ].join('/');
  }

  /**
   * Returns Full filename without extension (e.g. /path/to/file)
   */
  public getPathFromUuid(guid: string): string {
    return [
      guid.substr(0, 2),
      guid.substr(2, 2),
      guid,
    ].join('/');
  }

  public resolveFile(filedata: Pick<FileBag, 'id' | 'url' | 'mimeType' | 'isLocalFile'>) {
    const { mimeType, isLocalFile, url, id } = filedata;
    if (!isLocalFile) {
      return {
        resolveAbsolutePath: url,
        resolvePath: url,
      };
    }

    const { storageAbsolutePath, storagePath } = this.getStoragePath();
    const ext = this.getExtensionByMimeType(mimeType);
    const fileLocation = this.getPathFromUuid(id);

    return {
      resolvePath: path.join(storagePath, `${fileLocation}.${ext}`),
      resolveAbsolutePath: path.join(storageAbsolutePath, `${fileLocation}.${ext}`),
    };
  }

  public async applyTransform(filepath: string, transform: ImageTransform) {
    const { context } = this.props;
    const { logger } = context;

    if (!fs.existsSync(filepath)) {
      logger.files.error(`Transform error. File «${filepath}» not found`);

      return;
    }

    if (!fs.readFileSync(filepath)) {
      logger.files.error(`Transform error. File «${filepath}» not readable`);

      return;
    }

    let jimpHandle = await Jimp.read(filepath);

    if ('resize' in transform) {
      const { w, h } = transform.resize;
      try {
        jimpHandle = jimpHandle.resize(
          Math.min(w, IMAGE_TRANSFORM_MAX_WITH),
          Math.min(h, IMAGE_TRANSFORM_MAX_HEIGHT),
        );
      } catch (err) {
        logger.files.error('Transform «resize» error', { err });
      }

    }

    if ('crop' in transform) {
      const { x, y, w, h } = transform.crop;
      try {
        jimpHandle = jimpHandle.crop(
          Math.min(x, IMAGE_TRANSFORM_MAX_WITH),
          Math.min(y, IMAGE_TRANSFORM_MAX_HEIGHT),
          Math.min(w, IMAGE_TRANSFORM_MAX_WITH),
          Math.min(h, IMAGE_TRANSFORM_MAX_HEIGHT),
        );
      } catch (err) {
        logger.files.error('Transform «crop» error', { err });
      }
    }

    if ('cover' in transform) {
      const { w, h } = transform.cover;
      try {
        jimpHandle = jimpHandle.cover(
          Math.min(w, IMAGE_TRANSFORM_MAX_WITH),
          Math.min(h, IMAGE_TRANSFORM_MAX_HEIGHT),
        );
      } catch (err) {
        logger.files.error('Transform «cover» error', { err });
      }
    }

    if ('contain' in transform) {
      const { w, h } = transform.contain;
      try {
        jimpHandle = jimpHandle.contain(
          Math.min(w, IMAGE_TRANSFORM_MAX_WITH),
          Math.min(h, IMAGE_TRANSFORM_MAX_HEIGHT),
        );
      } catch (err) {
        logger.files.error('Transform «contain» error', { err });
      }
    }

    if ('scaleToFit' in transform) {
      const { w, h } = transform.scaleToFit;
      try {
        jimpHandle = jimpHandle.scaleToFit(
          Math.min(w, IMAGE_TRANSFORM_MAX_WITH),
          Math.min(h, IMAGE_TRANSFORM_MAX_HEIGHT),
        );
      } catch (err) {
        logger.files.error('Transform «scaleToFit» error', { err });
      }
    }


    if ('gaussian' in transform) {
      const gaussian = transform.gaussian;
      try {
        jimpHandle = jimpHandle.gaussian(
          Math.min(gaussian, IMAGE_TRANSFORM_MAX_GAUSSIAN),
        );
      } catch (err) {
        logger.files.error('Transform «gaussian» error', { err });
      }
    }

    if ('blur' in transform) {
      const blur = transform.blur;
      try {
        jimpHandle = jimpHandle.blur(
          Math.min(blur, IMAGE_TRANSFORM_MAX_BLUR),
        );
      } catch (err) {
        logger.files.error('Transform «blur» error', { err });
      }
    }

    if ('greyscale' in transform) {
      const greyscale = transform.greyscale;
      try {
        if (greyscale === true) {
          jimpHandle = jimpHandle.grayscale();
        }
      } catch (err) {
        logger.files.error('Transform «greyscale» error', { err });
      }
    }

    await jimpHandle.writeAsync(filepath);

    // do not wait this operation
    this.compressImage(filepath, true);
  }

  /**
   * Returns filename at static prefix root (e.g. /static/path/to/file.ext)
   */
  public getFilenameFromUuid(guid: string, delimiter = 's') {
    const { storagePath, cachePath, temporaryPath } = this.props;
    const localPath = this.getPathFromUuid(guid);

    switch (delimiter) {
      case CACHE_DELIMITER:
        return path.join('/', cachePath, localPath);

      case TEMPORARY_DELIMITER:
        return path.join('/', temporaryPath, localPath);

      case STATIC_DELIMITER:
      default:
        return path.join('/', storagePath, localPath);
    }
  }

  public getStoragePath() {
    const { storagePath } = this.props;

    return {
      storagePath,
      storageAbsolutePath: path.resolve(__dirname, '..', storagePath),
    };
  }

  public getCachePath() {
    const { cachePath } = this.props;

    return {
      cachePath,
      cacheAbsolutePath: path.resolve(__dirname, '..', cachePath),
    };
  }

  public getTemporaryPath() {
    const { temporaryPath } = this.props;

    return {
      temporaryPath,
      temporaryAbsolutePath: path.resolve(__dirname, '..', temporaryPath),
    };
  }


  public getFileTypeByMimeType(mimeType: string): FileType {
    switch (mimeType) {
      case 'image/tiff':
      case 'image/png':
      case 'image/jpeg':
      case 'image/gif':
      case 'image/svg':
        return 'image';
      default:
        return 'document';
    }
  }


  /**
   * Resolve extension by mimeType or return default `txt` extension
   */
  public getExtensionByMimeType(mimeType: string) {
    return mime.extension(mimeType) || 'txt';
  }


  /**
   * Resolve mimeType by mime database or return default `text/plain` mimeType
   */
  public getMimeTypeByExtension(extension: string) {
    return mime.lookup(extension) || 'text/plain';
  }

  /**
   * Extract file extension
   */
  public extractExtensionFromFilename(filename: string) {
    return filename.split('.').pop();
  }

  /**
   * Extract file extension and try to resolve mimeType by mime database
   */
  public getMimeTypeByFilename(filename: string) {
    const ext = this.extractExtensionFromFilename(filename);

    return this.getMimeTypeByExtension(ext);
  }

  /**
   * Resolve mimeType. \
   * You may pass invalid mimeType but valid filename with extension \
   * This method should return valid mimeType \
   * \
   * `Note:` On Linux OS the file Manager can pass invalid mime types \
   * when uploading files to the server
   */
  public resolveMimeType(filename: string, mimeType: string) {
    const ext = this.extractExtensionFromFilename(filename);
    const extFromMimeType = mime.extension(mimeType);

    if (ext === extFromMimeType) {
      return mimeType;
    }

    return this.getMimeTypeByExtension(filename);
  }

  /**
   * Create WriteStream and reutn it with the file data/
   * File will be registered in common file store
   */
  public async getFileStream(fileInfo: FileBagCreate): Promise<{
      stream: fs.WriteStream;
      file: FileBag;
    }> {
    const { id, absoluteFilename } = await this.createFile(null, fileInfo);
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
      file: FileBag;
      expireAt: Date;
    }> {
    const { context, temporaryTTL } = this.props;
    const { timezone } = context;
    const id = fileInfo.id || uuidv4();
    const { temporaryAbsolutePath } = this.getTemporaryPath();

    const expireAt = fileInfo.expireAt || temporaryTTL;
    const filename = this.getPathFromUuid(id);
    const ext = this.getExtensionByMimeType(fileInfo.mimeType);
    const absoluteFilename = path.join(temporaryAbsolutePath, `${filename}.${ext}`);
    await this.createTemporaryFile(null, {
      id,
      isLocalFile: true,
      mimeType: fileInfo.mimeType,
      category: 'temporary',
      type: 'document',
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

  public async getTemporaryFile(id: string): Promise<TemporaryFileBag | false> {
    const {
      hostname,
      staticPrefix,
      context,
    } = this.props;
    const { redis, logger, timezone } = context;
    const { temporaryAbsolutePath } = this.getTemporaryPath();

    const payloadStr = await redis.hget(REDIS_TEMPORARY_NAME, id);
    let payload: RedisTemporaryValue;

    try {
      payload = JSON.parse(payloadStr) as RedisTemporaryValue;
    } catch (err) {
      logger.files.error('Failed to decode temporary data JSON', { err });
    }

    if (payload === null) {
      return false;
    }

    const absoluteFilename = path.join(temporaryAbsolutePath, payload.filename);
    if (!fs.existsSync(absoluteFilename)) {
      return false;
    }

    const { fileInfo, exp } = payload;

    return {
      id,
      expiredAt: moment.tz(exp, timezone).toDate(),
      createdAt: moment.tz(timezone).toDate(),
      updatedAt: moment.tz(timezone).toDate(),
      url: `${hostname}${staticPrefix}/${TEMPORARY_DELIMITER}/${payload.filename}`,
      ...fileInfo,
    };
  }

  public async getFiles(filter: Partial<OutputFilter>): Promise<ListResponse<FileBag>> {
    const { context, staticPrefix, hostname } = this.props;
    const { knex } = context;
    const { limit, offset, orderBy, where } = filter;

    const response = await knex
      .select([
        '*',
        knex.raw('count(*) over() as "totalCount"'),
      ])
      .orderBy(convertOrderByToKnex(orderBy))
      .from<FileBagTable, FileBagTable[]>('fileStorage')
      .limit(limit || 1)
      .offset(offset || 0)
      .where((builder) => convertWhereToKnex(builder, where))
      .orderBy(convertOrderByToKnex(orderBy))
      .then((nodes) => nodes.map((node) => ({
        ...node,
        url: node.isLocalFile
          ? `${hostname}${staticPrefix}/${STATIC_DELIMITER}/${node.url}`
          : node.url,
      })))
      .then((nodes) => ({
        ...extractTotalCountPropOfNode(nodes),
          offset,
          limit,
          orderBy,
          where,
        }));

    return response;
  }

  public async getFilesByIds(ids: string[]): Promise<FileBag[]> {
    const { nodes } = await this.getFiles({
      where: [['id', 'in', ids]],
      offset: 0,
      limit: ids.length,
    });

    return nodes;
  }

  public async getFile(id: string): Promise<FileBag | false> {
    const nodes = await this.getFilesByIds([id]);

    return nodes.length ? nodes[0] : false;
  }

  public async getTemporaryFilesByIds(ids: string[]): Promise<TemporaryFileBag[]> {
    const files: TemporaryFileBag[] = [];
    await ids.reduce(async (prev, id) => {
      await prev;

      const file = await this.getTemporaryFile(id);

      if (file) {
        files.push(file);
      }
    }, Promise.resolve());

    return files;
  }

  public preparePayloadToSQL(fileData: Partial<FileBag>): Partial<FileBagTableInput> {
    const { context } = this.props;
    const { timezone } = context;

    const {
      metaData, createdAt, updatedAt, ...otherFileData
    } = fileData;

    const retDataInput: Partial<FileBagTableInput> = otherFileData;

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

  public async updateFile(id: string, fileData: Partial<FileBag>) {
    const { context } = this.props;
    const { knex, timezone } = context;
    const result = await knex<FileBagTableInput>('fileStorage')
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
    fileInfo: UploadFileInput,
    expireAt?: number,
  ): Promise<{id: string; absoluteFilename: string; }> {

    const { temporaryTTL, context } = this.props;
    const { redis } = context;
    const { temporaryAbsolutePath } = this.getTemporaryPath();

    const id = fileInfo.id || uuidv4();
    const ext = this.getExtensionByMimeType(fileInfo.mimeType);
    const type = this.getFileTypeByMimeType(fileInfo.mimeType);
    const filename = `${this.getPathFromUuid(id)}.${ext}`;

    const absoluteFilename = path.join(temporaryAbsolutePath, filename);
    const dirname = path.dirname(absoluteFilename);
    const exp = (new Date().getTime() + ((expireAt || temporaryTTL) * 1000));
    const token = id;
    const payload: RedisTemporaryValue = {
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


  public async compressImage(
    absoluteFilename: string,
    skipResize?: boolean,
  ): Promise<CompressImageStats> {
    const { imageOptimMaxWidth, imageOptimMaxHeight, compressionOptions, context } = this.props;
    const { logger } = context;

    const originalFileSize = fs.lstatSync(absoluteFilename).size;
    const stats: CompressImageStats = {
      filename: absoluteFilename,
      size: {
        original: originalFileSize,
        scaled: originalFileSize,
        compressed: originalFileSize,
      },
      time: {
        scaled: 0,
        compressed: 0,
        total: 0,
      },
      profit: {
        scaled: 0,
        compressed: 0,
        total: 0,
      },
    };

    if (!skipResize) {
      stats.time.scaled = performance.now();
      const jimpHandle = await Jimp.read(absoluteFilename);
      if (
        jimpHandle.getWidth() > imageOptimMaxWidth
        || jimpHandle.getHeight() > imageOptimMaxHeight
      ) {

        jimpHandle.scaleToFit(imageOptimMaxWidth, imageOptimMaxHeight);
        jimpHandle.writeAsync(absoluteFilename);
      }

      stats.time.scaled = performance.now() - stats.time.scaled;
      stats.size.scaled = fs.lstatSync(absoluteFilename).size;
      stats.profit.scaled = Math.floor(
        (stats.size.scaled * 100) / stats.size.original,
      );

      if (stats.size.scaled >= stats.size.original) {
        stats.profit.scaled = 100 - stats.profit.scaled;
      }
    }


    stats.time.compressed = performance.now();
    const optimizad = await imagemin([absoluteFilename], {
      plugins: [
        imageminMozjpeg(compressionOptions.mozJpeg),
        imageminOptipng(compressionOptions.optiPng),
        imageminPngquant(compressionOptions.pngQuant),
      ],
    });
    fs.writeFileSync(absoluteFilename, optimizad[0].data);

    stats.time.compressed = performance.now() - stats.time.compressed;
    stats.size.compressed = fs.lstatSync(absoluteFilename).size;
    stats.profit.compressed = Math.floor(
      (stats.size.compressed * 100) / stats.size.scaled,
    );

    if (stats.size.compressed >= stats.size.scaled) {
      stats.size.compressed = 100 - stats.size.compressed;
    }

    stats
      .profit
      .total = stats.profit.compressed + stats.profit.scaled;

    stats
      .time
      .total = stats.time.compressed + stats.time.scaled;

    logger.files.info(
      `File optimization profit: ${stats.profit.total}% in ${(stats.time.total / 1000).toFixed(2)}sec.`,
      stats,
    );

    return stats;
  }

  public async createFile(
    fileStream: ReadStream | null,
    fileInfo: FileBagCreate,
  ): Promise<{id: string; absoluteFilename: string; }> {
    const { context } = this.props;
    const { knex, timezone } = context;
    const { storageAbsolutePath } = this.getStoragePath();

    const id = fileInfo.id || uuidv4();
    const ext = this.getExtensionByMimeType(fileInfo.mimeType);
    const localFilename = `${this.getPathFromUuid(id)}.${ext}`;
    const url = (fileInfo.isLocalFile || !fileInfo.url) ? localFilename : fileInfo.url;

    try {
      await knex<FileBagTableInput>('fileStorage')
        .insert({
          ...this.preparePayloadToSQL(fileInfo),
          id,
          url,
          type: this.getFileTypeByMimeType(fileInfo.mimeType),
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
    const { temporaryAbsolutePath } = this.getTemporaryPath();
    const payload = await this.getTemporaryFile(id);
    const filename = this.getPathFromUuid(id);


    if (!payload) {
      throw new ServerError(`File ${id} does not have in temporary cache`);
    }

    const ext = this.getExtensionByMimeType(payload.mimeType);
    const absoluteFilename = path.join(temporaryAbsolutePath, `${filename}.${ext}`);
    if (!fs.existsSync(absoluteFilename)) {
      throw new ServerError(`File ${id} not exists in path ${absoluteFilename}`);
    }

    const stream = fs.createReadStream(absoluteFilename);
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { expiredAt, ...otherFileData } = payload;
    const fileData = await this.createFile(stream, {
      ...otherFileData,
      isLocalFile: true,
    });

    return fileData;
  }

  public async deleteFilesByOwner(owner: string | string[]): Promise<string[] | false> {
    const { context } = this.props;
    const { dataloader } = context;

    const owners = Array.isArray(owner) ? owner : [owner];
    const files = await this.getFiles({
      where: [
        ['owner', 'in', owners],
      ],
    });
    const idsByOwner = files.nodes.map((node) => node.id);
    if (idsByOwner.length) {
      const deletedIds = await this.deleteStaticFiles(idsByOwner);
      deletedIds.forEach((deletedId) => {
        dataloader.files.clear(deletedId);
      });

      return deletedIds;
    }

    return false;
  }

  public async flush() {
    const { context } = this.props;
    const { dataloader } = context;
    const { storageAbsolutePath } = this.getStoragePath();
    const { cacheAbsolutePath } = this.getCachePath();
    const { temporaryAbsolutePath } = this.getTemporaryPath();
    const { redis, knex, logger } = context;

    logger.files.info(
      '!!! WARNING. All files will be deleted permanently !!!',
    );

    dataloader.files.clearAll();
    dataloader.tremporaryFiles.clearAll();

    try {
      await redis.del(REDIS_CACHE_NAME);
      await redis.del(REDIS_TEMPORARY_NAME);
    } catch (err) {
      throw new ServerError('Flush. Failed to remove files from Redis');
    }

    try {
      await knex('fileStorage').del();
    } catch (err) {
      throw new ServerError('Flush. Failed to remove files from Database');
    }
    try {
      fs.rmSync(temporaryAbsolutePath, { force: true, recursive: true });
      fs.rmSync(cacheAbsolutePath, { force: true, recursive: true });
      fs.rmSync(storageAbsolutePath, { force: true, recursive: true });
    } catch (err) {
      throw new ServerError('Flush. Failed to remove files from disk');
    }

    logger.files.info(
      '!!! WARNING. All files has beed deleted permanently !!!',
    );
  }

  public async deleteStaticFiles(ids: string[]): Promise<string[]> {
    const { context } = this.props;
    const { knex, logger } = context;
    const filesList = await this.getFilesByIds(ids);

    if (filesList.length) {
      filesList.forEach((fileData) => {
        // if is local file
        if (fileData.isLocalFile || fileData.url.match(/^\/[a-z0-9]+/i)) {
          const filename = this.getFilenameFromUuid(fileData.id, STATIC_DELIMITER);
          const ext = this.getExtensionByMimeType(fileData.mimeType);
          const fullFilenamePath = path.resolve(__dirname, '..', `${filename}.${ext}`);
          const dirname = path.dirname(fullFilenamePath);

          // remove file
          if (fs.existsSync(fullFilenamePath)) {
            try {
              fs.unlinkSync(fullFilenamePath);
            } catch (err) {
              throw new ServerError(`
                Failed to delete file ${fileData.id} in path ${fullFilenamePath}`,
              { err });
            }

            try {
              this.removeEmptyDirectories(dirname);
            } catch (err) {
              throw new ServerError(`
                Failed to remove empty directories in path ${fullFilenamePath}`,
              { err });
            }
          } else {
            logger.files.info(`File ${fileData.id} not exists in path ${fullFilenamePath}`);
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

  public removeEmptyDirectories(directory: string) {

    const { context } = this.props;
    const { logger } = context;

    // lstat does not follow symlinks (in contrast to stat)
    const fileStats = fs.lstatSync(directory);
    if (!fileStats.isDirectory()) {
      return;
    }

    let fileNames = fs.readdirSync(directory);
    if (fileNames.length > 0) {
      fileNames.forEach((fileName) => {
        this.removeEmptyDirectories(path.join(directory, fileName));
      });

      // re-evaluate fileNames; after deleting subdirectory
      // we may have parent directory empty now
      fileNames = fs.readdirSync(directory);
    }

    if (fileNames.length === 0) {
      logger.files.debug(`Removing: «${directory}»`);
      fs.rmSync(directory, { recursive: true, force: true });
    }
  }

  public async rebaseCategories(categories: string[]): Promise<void> {
    const { context } = this.props;
    const { knex } = context;

    const payload = categories.map((category) => ({ category }));
    await knex
      .raw(`${knex('fileStorageCategories')
      .insert(payload).toString()} on conflict ("category") do nothing;`);

    await knex('fileStorageCategories')
      .del()
      .whereNotIn('category', categories);
  }
}


export default FileStorageService;
