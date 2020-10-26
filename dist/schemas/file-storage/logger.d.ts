import { Winston } from '@via-profit-services/core';
export declare const configureFileStorageLogger: (config: Config) => Winston.Logger;
interface Config {
    logDir: string;
    logFilenamePattern?: string;
}
export default configureFileStorageLogger;
