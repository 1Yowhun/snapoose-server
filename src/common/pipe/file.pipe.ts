import {
  ParseFilePipe,
  MaxFileSizeValidator,
  FileTypeValidator,
} from '@nestjs/common';

export const FrameFileValidationPipe = () =>
  new ParseFilePipe({
    validators: [
      new MaxFileSizeValidator({ maxSize: 5 * 1024 * 1024 }), // 5MB
      new FileTypeValidator({ fileType: '.(png|jpg|jpeg)' }),
    ],
  });
