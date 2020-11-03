/* eslint-disable import/prefer-default-export */
import { Knex } from '@via-profit-services/core';
import { v4 as uuidv4 } from 'uuid';

enum FileType {
  image = 'image',
  document = 'document',
}

interface AttachementField {
  id?: string;
  owner?: string;
  category: string;
  mimeType: any;
  url: string;
  type: FileType;
  isLocalFile?: boolean;
  label?: string;
  description?: string;
  metaData?: any;
}

export async function seed(knex: Knex): Promise<any> {
  return knex('fileStorage').del()
    .then(() => {
      const files: AttachementField[] = [
        {
          category: 'items',
          mimeType: 'image/jpeg',
          url: 'https://i.picsum.photos/id/873/400/400.jpg',
          isLocalFile: false,
          type: FileType.image,
          metaData: {
            alt: 'Item alt attribute',
            title: 'Item title attribute',
          },
        },
        {
          category: 'items',
          mimeType: 'image/jpeg',
          url: 'https://i.picsum.photos/id/521/400/400.jpg',
          isLocalFile: false,
          type: FileType.image,
          metaData: {
            alt: 'Item alt attribute',
          },
        },
      ];

      return knex('fileStorage').insert(files.map((fileData) => ({
        id: uuidv4(),
        owner: uuidv4(),
        ...fileData,
        metaData: JSON.stringify(fileData.metaData || {}),
      })));
    });
}
