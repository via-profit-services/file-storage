import 'winston-daily-rotate-file';
export declare const configureFileStorageLogger: (config: Config) => import("winston").Logger;
interface Config {
    logDir: string;
    logFilenamePattern?: string;
}
export default configureFileStorageLogger;
