import { Resolvers } from '@via-profit-services/file-storage';

import applyTemporary from './applyTemporary';
import clearCache from './clearCache';
import deleteFiles from './delete';
import update from './update';
import upload from './upload';
import uploadTemporary from './uploadTemporary';

const FileStorageMutation: Resolvers['FileStorageMutation'] = {
  upload,
  update,
  clearCache,
  delete: deleteFiles,
  uploadTemporary,
  applyTemporary,
};

export default FileStorageMutation;
