import { ConflictException, Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as argon2 from 'argon2';
import { AuthRepository } from './auth.repository.js';
import { CreateUserDto } from '../../../dto/user.dto.js';
import { ConfigService } from '@nestjs/config';
import { LoginDto } from '../../../dto/login.dto.js';
import { AppLogger } from '../../../common/logger.service.js';
import { generateId } from '../../../common/utils/generateCode.js';

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
      const normalizedName = dto.name.trim().toLowerCase();
      const hashedPassword = await argon2.hash(dto.password);

      const user = await this.authRepository.createUserWithUniqueName(
        tenantId,
        normalizedName,
        {
          tenantId,
          name: normalizedName,
          code: `USER-${generateId()}`,
          password: hashedPassword,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      );

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
      const normalizedName = dto.name.trim().toLowerCase();
      const tenantId =
        this.configService.getOrThrow<string>('DEFAULT_TENANT_ID');
      const user = await this.authRepository.findUser(tenantId, normalizedName);
      if (!user) {
        this.logger.warn('Login gagal, tidak ada nama', 'AuthService');
        throw new ConflictException(`Nama tidak ada, silahakan register`);
      }
      const isPasswordValid = await argon2.verify(user.password, dto.password);

      if (!isPasswordValid) {
        this.logger.warn('Login gagal, password salah', 'AuthService');
        throw new ConflictException(`Password salah`);
      }
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
