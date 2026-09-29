import { ConflictException, Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as argon2 from 'argon2';
import { AuthRepository } from './auth.repository.js';
import { CreateUserDto } from '../../../dto/user.dto.js';
import { ConfigService } from '@nestjs/config';
import { LoginDto } from '../../../dto/login.dto.js';
import { AppLogger } from '../../../common/logger.service.js';

@Injectable()
export class AuthService {
  constructor(
    private readonly jwt: JwtService,
    private readonly authRepository: AuthRepository,
    private readonly configService: ConfigService,
    private readonly logger: AppLogger,
  ) {}

  async register(dto: Omit<CreateUserDto, 'id' | 'tenantId' | 'code'>) {
    try {
      const tenantId =
        this.configService.getOrThrow<string>('DEFAULT_TENANT_ID');
      const existing = await this.authRepository.findUser(tenantId, dto.name);
      if (existing) {
        throw new ConflictException(`Nama sudah terdaftar`);
      }
      const hashedPassword = await argon2.hash(dto.password);

      const user = await this.authRepository.create(tenantId, {
        tenantId,
        code: 'USER',
        name: dto.name,
        password: hashedPassword,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      const accessToken = await this.jwt.signAsync({
        id: user.id,
        tenantId: user.tenantId,
        name: user.name,
        code: user.code,
      });

      this.logger.log(`User berhasil dibuat`, 'UserService');
      return {
        user: {
          id: user.id,
          tenantId: user.tenantId,
          name: user.name,
          code: user.code,
        },
        access_token: accessToken,
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
      const tenantId =
        this.configService.getOrThrow<string>('DEFAULT_TENANT_ID');
      const user = await this.authRepository.findUser(tenantId, dto.name);
      if (!user) {
        throw new ConflictException(`Nama atau password salah`);
      }
      const isPasswordValid = await argon2.verify(user.password, dto.password);

      if (!isPasswordValid) throw new ConflictException(`Password salah`);
      const accessToken = await this.jwt.signAsync({
        sub: user.id,
        name: user.name,
        code: user.code,
        tenantId: user.tenantId,
      });
      this.logger.log(`User berhasil login`, 'UserService');
      return {
        user: {
          id: user.id,
          name: user.name,
          code: user.code,
          tenantId: user.tenantId,
        },
        access_token: accessToken,
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
