import {
  Body,
  Controller,
  Get,
  Header,
  Headers,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  UploadedFiles,
  UseInterceptors,
} from '@nestjs/common';
import { SessionService } from './session.service.js';
import { DeviceOnly } from '../../common/decorators/device.decorator.js';
import { ResponseMessage } from '../../common/decorators/metadata.decorator.js';
import { RequestDevice } from '../../entity/requestUser.entity.js';
import { CurrentUser } from '../../common/decorators/currentUser.decorator.js';
import {
  SESSION_FILE_FIELDS,
  type SessionDto,
  type SessionFiles,
} from '../../dto/session.dto.js';
import { SessionFilesPipe } from '../../common/pipe/session-file.pipe.js';
import { FileFieldsInterceptor } from '@nestjs/platform-express';
import { Public } from '../../common/decorators/public.decorator.js';

@Controller('session')
export class SessionController {
  constructor(private readonly sessionService: SessionService) {}

  @DeviceOnly()
  @Post(':id')
  @ResponseMessage('Session Photo has been processed')
  @Header('content-type', 'application/json')
  async session(
    @Headers('idempotency-key') idempotencyKey: string,
    @Body() dto: SessionDto,
    @CurrentUser() device: RequestDevice,
    @Param('id', new ParseUUIDPipe()) id: string,
  ) {
    return await this.sessionService.createSession(
      dto.consentPublish,
      id,
      device,
      idempotencyKey,
    );
  }

  @DeviceOnly()
  @Patch(':id/complete')
  @ResponseMessage('Session Photo has completed, please wait for qr photo')
  @UseInterceptors(
    FileFieldsInterceptor(SESSION_FILE_FIELDS, {
      limits: { fileSize: 25 * 1024 * 1024, files: 13 },
    }),
  )
  @Header('content-type', 'application/json')
  async UpdateSession(
    @Headers('idempotency-key') idempotencyKey: string,
    @Body() dto: any,
    @CurrentUser() device: RequestDevice,
    @UploadedFiles(new SessionFilesPipe()) files: SessionFiles,
    @Param('id', new ParseUUIDPipe()) id: string,
  ) {
    return await this.sessionService.updateSession(id, device, files);
  }
}
