import { Node, DataLoader } from '@via-profit-services/core';
import { IFileBag, Context } from './types';
interface Loaders {
    files: DataLoader<string, Node<IFileBag>>;
}
export default function createLoaders(context: Context): Loaders;
export {};
