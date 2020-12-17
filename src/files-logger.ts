import {
  LoggersConfig, logFormatter,
  LOG_DATE_PATTERNT, LOG_MAX_SIZE, LOG_MAX_FILES, LOG_FILENAME_ERRORS, LOG_FILENAME_DEBUG,
} from '@via-profit-services/core';
import Winston from 'winston';
import 'winston-daily-rotate-file';

import { LOG_FILENAME_FILES_STORAGE } from './constants';

export default (config: LoggersConfig) => {
  const { logDir } = config;
  const { createLogger, transports } = Winston;

  return createLogger({
    level: 'debug',
    format: logFormatter,
    transports: [
      new transports.DailyRotateFile({
        filename: `${logDir}/${LOG_FILENAME_FILES_STORAGE}`,
        level: 'info',
        datePattern: LOG_DATE_PATTERNT,
        zippedArchive: true,
        maxSize: LOG_MAX_SIZE,
        maxFiles: LOG_MAX_FILES,
      }),
      new transports.DailyRotateFile({
        filename: `${logDir}/${LOG_FILENAME_ERRORS}`,
        level: 'error',
        datePattern: LOG_DATE_PATTERNT,
        zippedArchive: true,
        maxSize: LOG_MAX_SIZE,
        maxFiles: LOG_MAX_FILES,
      }),
      new transports.DailyRotateFile({
        filename: `${logDir}/${LOG_FILENAME_DEBUG}`,
        level: 'debug',
        datePattern: LOG_DATE_PATTERNT,
        zippedArchive: true,
        maxSize: LOG_MAX_SIZE,
        maxFiles: LOG_MAX_FILES,
      }),
    ],
  });
};

