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
import jimp from 'jimp';
import mime from 'mime-types';
import moment from 'moment-timezone';
// import Sharp from 'sharp';
import { v4 as uuidv4 } from 'uuid';

import { Context } from '../../context';
import { getParams } from './paramsBuffer';
import {
  IFileBag, IFileBagTable, IFileBagTableInput, FileType,
} from './types';

interface IProps {
  context: Context;
}

class FileStorageService {
  public props: IProps;

  public constructor(props: IProps) {
    this.props = props;
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
      case 'image/png':
      case 'image/jpeg':
      case 'image/webp':
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
      staticPrefix, host, ssl, staticDelimiter,
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
              ? `http${ssl ? 's' : ''}://${host}${staticPrefix}/${staticDelimiter}/${url}`
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
  ): Promise<{id: string; absoluteFilename: string; }> {
    const { knex, timezone } = this.props.context;
    const { storageAbsolutePath, imageOptimMaxWidth, imageOptimMaxHeight } = getParams();

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
            jimp.read(absoluteFilename)
              .then((image) => {
                return image.scaleToFit(imageOptimMaxWidth, imageOptimMaxHeight);
              }).then((image) => {
                return image.writeAsync(absoluteFilename);
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


      // const buffer = Buffer.from(fileStream);
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

    results.forEach((fileUuid) => {
      const filename = FileStorageService.getFilenameFromUuid(fileUuid);
      console.log(`remove file from path ${filename}`);
    });

    return results;
  }
}


export default FileStorageService;
export { FileStorageService };
