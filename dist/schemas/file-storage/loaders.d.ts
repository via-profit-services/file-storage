import { Node, DataLoader } from '@via-profit-services/core';
import { IFileBag, ITemporaryFileBag, Context } from './types';
interface Loaders {
    files: DataLoader<string, Node<IFileBag>>;
    tremporaryFiles: DataLoader<string, Node<ITemporaryFileBag>>;
}
export default function createLoaders(context: Context): Loaders;
export {};
