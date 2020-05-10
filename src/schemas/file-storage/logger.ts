import { transports, createLogger, format } from 'winston';
import 'winston-daily-rotate-file';

import {
  LOG_DATE_PATTERNT,
  LOG_MAZ_FILES,
  LOG_MAZ_SIZE,
  LOG_FILENAME_ERRORS,
  LOG_FILENAME_DEBUG,
  LOG_FILENAME_FILES_STORAGE,
} from './constants';


const loggerFormatter = format.combine(
  format.metadata(),
  format.json(),
  format.timestamp({ format: 'YYYY-MM-DDTHH:mm:ssZZ' }),
  format.splat(),
  format.printf((info) => {
    const {
      timestamp, level, message, metadata,
    } = info;
    const meta = JSON.stringify(metadata) !== '{}' ? metadata : null;

    return `${timestamp} ${level}: ${message} ${meta ? JSON.stringify(meta) : ''}`;
  }),
);


export const configureFileStorageLogger = (config: Config) => {
  const { logDir, logFilenamePattern } = config;

  const logFilename = logFilenamePattern || LOG_FILENAME_FILES_STORAGE;

  return createLogger({
    level: 'debug',
    format: loggerFormatter,
    transports: [
      new transports.DailyRotateFile({
        filename: `${logDir}/${logFilename}`,
        level: 'info',
        datePattern: LOG_DATE_PATTERNT,
        zippedArchive: true,
        maxSize: LOG_MAZ_SIZE,
        maxFiles: LOG_MAZ_FILES,
      }),
      new transports.DailyRotateFile({
        filename: `${logDir}/${LOG_FILENAME_ERRORS}`,
        level: 'error',
        datePattern: LOG_DATE_PATTERNT,
        zippedArchive: true,
        maxSize: LOG_MAZ_SIZE,
        maxFiles: LOG_MAZ_FILES,
      }),
      new transports.DailyRotateFile({
        filename: `${logDir}/${LOG_FILENAME_DEBUG}`,
        level: 'debug',
        datePattern: LOG_DATE_PATTERNT,
        zippedArchive: true,
        maxSize: LOG_MAZ_SIZE,
        maxFiles: LOG_MAZ_FILES,
      }),
    ],
  });
};

interface Config {
  logDir: string;
  logFilenamePattern?: string;
}

export default configureFileStorageLogger;
