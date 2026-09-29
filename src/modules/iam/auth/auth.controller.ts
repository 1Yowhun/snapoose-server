import { Body, Controller, Header, HttpCode, Post, Req } from '@nestjs/common';
import { AppLogger } from '../../../common/logger.service.js';
import { AuthService } from './auth.service.js';
import { RegisterDto } from '../../../dto/register.dto.js';
import { LoginDto } from '../../../dto/login.dto.js';
import { Public } from '../../../common/decorators/public.decorator.js';

@Controller('auth')
export class AuthController {
  constructor(
    private readonly logger: AppLogger,
    private readonly authService: AuthService,
  ) {}

  @Public()
  @Post('register')
  @HttpCode(201)
  @Header('content-type', 'application/json')
  async register(@Body() dto: RegisterDto) {
    const createUser = await this.authService.register(dto);
    const response = {
      success: true,
      message: 'User created successfully',
      data: createUser,
    };
    return response;
  }

  @Public()
  @Post('login')
  @HttpCode(200)
  @Header('content-type', 'application/json')
  async login(@Body() dto: LoginDto) {
    const loginUser = await this.authService.login(dto);
    const response = {
      success: true,
      message: 'User Login successfully',
      data: loginUser,
    };
    this.logger.log(
      `POST /auth/login - Response: ${loginUser.user.name}`,
      'AuthController',
    );
    return response;
  }
}
