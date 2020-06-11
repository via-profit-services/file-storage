import {
  LOG_MAZ_FILES, LOG_MAZ_SIZE, LOG_DATE_PATTERNT, LOG_FILENAME_DEBUG, LOG_FILENAME_ERRORS,
} from '@via-profit-services/core';

export const TIMEOUT_MAX_VALUE = 2147483647;
export const TEMPORARY_FILE_EXPIRED_AT_MLSEC = 1000 * 60;
export const REDIS_CACHE_NAME = 'fileStorageCache';
export const CACHE_FILES_DEFAULT_TTL = 86400; // 1 day
export const DEFAULT_IMAGE_OPTIM_MAX_WIDTH = 1200;
export const DEFAULT_IMAGE_OPTIM_MAX_HEIGHT = 800;
export const DEFAULT_STORAGE_PATH = './public/fileStorage/files';
export const DEFAULT_CACHE_PATH = './public/fileStorage/cache';
export const DEFAULT_TEMPORARY_PATH = './public/fileStorage/temp';
export const DEFAULT_STATIC_PREFIX = '/static';
export const DEFAULT_HOSTNAME = 'http://localhost:80';
export const DEFAULT_STATIC_DELIMITER = 's';
export const DEFAULT_CACHE_DELIMITER = 'c';
export const DEFAULT_TEMPORARY_DELIMITER = 't';
export const LOG_FILENAME_FILES_STORAGE = 'file-storage-%DATE%.log';
export const IMAGE_TRANSFORM_MAX_WITH = 3000;
export const IMAGE_TRANSFORM_MAX_HEIGHT = 3000;
export const IMAGE_TRANSFORM_MAX_BLUR = 20;
export const IMAGE_TRANSFORM_MAX_GAUSSIAN = 20;
export {
  LOG_MAZ_FILES,
  LOG_MAZ_SIZE,
  LOG_DATE_PATTERNT,
  LOG_FILENAME_DEBUG,
  LOG_FILENAME_ERRORS,
};
