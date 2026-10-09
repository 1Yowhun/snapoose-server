import { Body, Controller, Header, HttpCode, Post, Req } from '@nestjs/common';
import { AppLogger } from '../../../common/logger.service.js';
import { AuthService } from './auth.service.js';
import { RegisterDto } from '../../../dto/register.dto.js';
import { LoginDto } from '../../../dto/login.dto.js';
import { Public } from '../../../common/decorators/public.decorator.js';
import { ResponseMessage } from '../../../common/decorators/metadata.decorator.js';

@Controller('auth')
export class AuthController {
  constructor(
    private readonly logger: AppLogger,
    private readonly authService: AuthService,
  ) {}

  @Public()
  @ResponseMessage('User created successfully')
  @Post('register')
  @Header('content-type', 'application/json')
  async register(@Body() dto: RegisterDto) {
    return await this.authService.register(dto);
  }

  @Public()
  @ResponseMessage('User Login successfully')
  @Post('login')
  @Header('content-type', 'application/json')
  async login(@Body() dto: LoginDto) {
    return await this.authService.login(dto);
  }
}
