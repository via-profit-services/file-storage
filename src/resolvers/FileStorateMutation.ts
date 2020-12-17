import { IObjectTypeResolver } from '@graphql-tools/utils';
import { Context } from '@via-profit-services/core';

import ApplyTemporary from './ApplyTemporary';
import DeleteFiles from './DeleteFiles';
import Update from './Update';
import UploadFiles from './UploadFiles';
import UploadTemporaryFiles from './UploadTemporaryFiles';

const FileStorageMutation: IObjectTypeResolver<unknown, Context, unknown> = {
  upload: UploadFiles,
  delete: DeleteFiles,
  update: Update,
  uploadTemporary: UploadTemporaryFiles,
  applyTemporary: ApplyTemporary,
};

export default FileStorageMutation;
