import { Body, Controller, Header, Post } from '@nestjs/common';
import { AuthService } from './auth.service.js';
import { RegisterDto } from '../../../dto/register.dto.js';
import { LoginDto } from '../../../dto/login.dto.js';
import { Public } from '../../../common/decorators/public.decorator.js';
import { ResponseMessage } from '../../../common/decorators/metadata.decorator.js';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Public()
  @ResponseMessage('User registered successfully')
  @Post('register')
  @Header('content-type', 'application/json')
  async register(@Body() dto: RegisterDto) {
    return await this.authService.register(dto);
  }

  @Public()
  @ResponseMessage('Login successful')
  @Post('login')
  @Header('content-type', 'application/json')
  async login(@Body() dto: LoginDto) {
    return await this.authService.login(dto);
  }
}
