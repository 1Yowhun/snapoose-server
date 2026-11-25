import { BadRequestException, Injectable, PipeTransform } from '@nestjs/common';
import type { SessionFiles } from '../../dto/session.dto.js';
const RULES = {
  photos: {
    types: ['image/jpeg', 'image/png'],
    maxMb: 10,
  },
  framed: {
    types: ['image/jpeg', 'image/png'],
    maxMb: 10,
  },
  gif: {
    types: ['image/gif', 'video/mp4'],
    maxMb: 15,
  },
  //   livePhoto: {
  //     types: ['video/mp4', 'video/quicktime'],
  //     maxMb: 25,
  //   },
} as const;

// const REQUIRED = ['framed', 'gif', 'livePhoto'] as const;
const REQUIRED = ['framed', 'gif'] as const;

@Injectable()
export class SessionFilesPipe implements PipeTransform {
  transform(files: SessionFiles) {
    const photos = files?.photos ?? [];
    if (photos.length < 3 || photos.length > 10)
      throw new BadRequestException('Photos must contain 3 to 10 files');
    const missing = REQUIRED.filter((field) => !files?.[field]?.length);
    if (missing.length)
      throw new BadRequestException(
        `${missing.join(', ')} ${missing.length > 1 ? 'are' : 'is'} required`,
      );

    for (const [field, rule] of Object.entries(RULES)) {
      for (const f of files[field as keyof SessionFiles] ?? []) {
        if (!(rule.types as readonly string[]).includes(f.mimetype))
          throw new BadRequestException(
            `${field} has an unsupported file type`,
          );
        if (f.size > rule.maxMb * 1024 * 1024)
          throw new BadRequestException(
            `${field} must not exceed ${rule.maxMb}MB`,
          );
      }
    }
    return files;
  }
}
