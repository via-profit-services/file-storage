import type Knex from 'knex';
import { v4 as uuidv4 } from 'uuid';

import type { FileBagTableInput } from '@via-profit-services/file-storage';

enum FileType {
  image = 'image',
  document = 'document',
}
export async function seed(knex: Knex): Promise<any> {
  return knex('fileStorage').del()
    .then(() => {
      const files: FileBagTableInput[] = [
        {
          id: uuidv4(),
          owner: uuidv4(),
          category: 'items',
          mimeType: 'image/jpeg',
          url: 'https://i.picsum.photos/id/873/400/400.jpg',
          isLocalFile: false,
          type: FileType.image,
          metaData: JSON.stringify({
            alt: 'Item alt attribute',
            title: 'Item title attribute',
          }),
        },
        {
          id: uuidv4(),
          owner: uuidv4(),
          category: 'items',
          mimeType: 'image/jpeg',
          url: 'https://i.picsum.photos/id/521/400/400.jpg',
          isLocalFile: false,
          type: FileType.image,
          metaData: JSON.stringify({
            alt: 'Item alt attribute',
          }),
        },
      ];

      return knex('fileStorage').insert(files);
    });
}
