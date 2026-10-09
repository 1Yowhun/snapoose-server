import {
  ConflictException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as argon2 from 'argon2';
import { AuthRepository } from './auth.repository.js';
import { CreateUserDto } from '../../../dto/user.dto.js';
import { ConfigService } from '@nestjs/config';
import { LoginDto } from '../../../dto/login.dto.js';
import { AppLogger } from '../../../common/logger.service.js';
import { encryptAccessToken } from '../../../common/utils/encrypt.js';

@Injectable()
export class AuthService {
  constructor(
    private readonly jwt: JwtService,
    private readonly authRepository: AuthRepository,
    private readonly configService: ConfigService,
    private readonly logger: AppLogger,
  ) {}

  async register(dto: CreateUserDto) {
    try {
      const hashedPassword = await argon2.hash(dto.password);
      const payload = {
        tenantId: dto.tenantId,
        name: dto.name,
        password: hashedPassword,
      };

      const user = await this.authRepository.createUser(payload);

      this.logger.log(`User berhasil dibuat`, 'UserService');
      return {
        user: {
          id: user.id,
          tenantId: user.tenantId,
          name: user.name,
          code: user.code,
        },
      };
    } catch (error) {
      this.logger.logError(
        'Terjadi masalah ketika membuat User',
        error,
        'UserService',
      );
      throw error;
    }
  }

  async login(dto: LoginDto) {
    try {
      const user = await this.authRepository.findByName(dto.name);
      const invalid = new UnauthorizedException('Nama atau password salah');
      if (!user) throw invalid;
      const ok = await argon2.verify(user.password, dto.password);
      if (!ok) throw invalid;
      const payload = {
        sub: user.id,
        name: user.name,
        tenantId: user.tenantId,
        code: user.code,
      };

      const accessToken = await this.jwt.signAsync(payload);

      const encryptToken = encryptAccessToken(
        accessToken,
        this.configService.getOrThrow<string>('ENCRYPTION_KEY'),
      );
      this.logger.log(`User berhasil login`, 'UserService');
      return {
        user: {
          id: user.id,
          name: user.name,
          code: user.code,
          tenantId: user.tenantId,
        },
        encryptedToken: encryptToken,
      };
    } catch (error) {
      this.logger.logError(
        'Terjadi masalah ketika login',
        error,
        'UserService',
      );
      throw error;
    }
  }
}
