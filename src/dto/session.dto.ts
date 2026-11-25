import { Transform } from 'class-transformer';
import { IsBoolean } from 'class-validator';

export class SessionDto {
  @Transform(({ value }) =>
    value === 'true' ? true : value === 'false' ? false : value,
  )
  @IsBoolean({ message: 'Consentpublish must be a boolean (true or false)' })
  consentPublish: boolean;
}

export const SESSION_FILE_FIELDS = [
  { name: 'photos', maxCount: 10 },
  { name: 'framed', maxCount: 1 },
  { name: 'gif', maxCount: 1 },
  { name: 'livePhoto', maxCount: 1 },
];

export type SessionFiles = {
  photos?: Express.Multer.File[];
  framed?: Express.Multer.File[];
  gif?: Express.Multer.File[];
  livePhoto?: Express.Multer.File[];
};

export type UploadItem = {
  kind: 'FRAMED' | 'PHOTO' | 'GIF' | 'LIVE_VIDEO';
  key: string;
  file: Express.Multer.File;
  position: number;
};
