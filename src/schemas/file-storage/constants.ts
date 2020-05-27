import {
  LOG_MAZ_FILES, LOG_MAZ_SIZE, LOG_DATE_PATTERNT, LOG_FILENAME_DEBUG, LOG_FILENAME_ERRORS,
} from '@via-profit-services/core';

export const TEMPORARY_FILE_EXPIRED_AT_SEC = 1000 * 60;
export const CRON_JOB_CLEAR_CACHE_NAME = 'fileStorageClearCache';
export const REDIS_CACHE_NAME = 'fileStorageCache';
export const LOG_FILENAME_FILES_STORAGE = 'file-storage-%DATE%.log';
export {
  LOG_MAZ_FILES,
  LOG_MAZ_SIZE,
  LOG_DATE_PATTERNT,
  LOG_FILENAME_DEBUG,
  LOG_FILENAME_ERRORS,
};
