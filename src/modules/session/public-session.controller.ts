import {
  Controller,
  Get,
  Header,
  Param,
  ParseUUIDPipe,
  Res,
} from '@nestjs/common';
import type { Response } from 'express';
import { Public } from '../../common/decorators/public.decorator.js';
import { ResponseMessage } from '../../common/decorators/metadata.decorator.js';
import { PublicSessionService } from './public-session.service.js';

@Controller('public/sessions')
export class PublicSessionController {
  constructor(private readonly publicSessionService: PublicSessionService) {}

  @Public()
  @Get(':token')
  @Header('Cache-Control', 'no-store')
  @ResponseMessage('Session photos retrieved successfully')
  async gallery(@Param('token') token: string) {
    return await this.publicSessionService.getGallery(token);
  }
  
  @Public()
  @Get(':token/media/:mediaId/download')
  async download(
    @Param('token') token: string,
    @Param('mediaId', new ParseUUIDPipe()) mediaId: string,
    @Res() res: Response,
  ) {
    const url = await this.publicSessionService.getDownloadUrl(token, mediaId);
    res.setHeader('Cache-Control', 'no-store');
    res.redirect(302, url);
  }
}
