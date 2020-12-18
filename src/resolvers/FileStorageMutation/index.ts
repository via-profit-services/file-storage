import { IObjectTypeResolver } from '@graphql-tools/utils';
import { Context } from '@via-profit-services/core';

import applyTemporary from './applyTemporary';
import deleteFiles from './delete';
import update from './update';
import upload from './upload';
import uploadTemporary from './uploadTemporary';

const FileStorageMutation: IObjectTypeResolver<unknown, Context, unknown> = {
  upload,
  update,
  delete: deleteFiles,
  uploadTemporary,
  applyTemporary,
};

export default FileStorageMutation;
