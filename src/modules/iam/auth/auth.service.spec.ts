import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Test, TestingModule } from '@nestjs/testing';
import { ConflictException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as argon2 from 'argon2';
import { AuthService } from './auth.service.js';
import { AuthRepository } from './auth.repository.js';
import { AppLogger } from '../../../common/logger.service.js';


vi.mock('argon2', () => ({
  hash: vi.fn(),
  verify: vi.fn(),
}));

describe('AuthService', () => {
  let service: AuthService;
  let authRepository: AuthRepository;
  let jwtService: JwtService;
  let configService: ConfigService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: AuthRepository,
          useValue: {
            findUser: vi.fn(),
            create: vi.fn(),
          },
        },
        {
          provide: JwtService,
          useValue: {
            signAsync: vi.fn(),
          },
        },
        {
          provide: ConfigService,
          useValue: {
            getOrThrow: vi.fn(),
          },
        },
        {
          provide: AppLogger,
          useValue: {
            log: vi.fn(),
            logError: vi.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    authRepository = module.get(AuthRepository);
    jwtService = module.get(JwtService);
    configService = module.get(ConfigService);

    vi.clearAllMocks();
  });

  describe('register', () => {
    const registerDto = { name: 'John Doe', password: 'password123' };

    it('should throw ConflictException when name already exists', async () => {
      vi.mocked(configService.getOrThrow).mockReturnValue('tenant-123');
      vi.mocked(authRepository.findUser).mockResolvedValue({
        id: '1',
        name: 'John Doe',
      } as any);

      await expect(service.register(registerDto as any)).rejects.toThrow(
        ConflictException,
      );

      expect(authRepository.create).not.toHaveBeenCalled();
    });

    it('should hash password and create user successfully', async () => {
      vi.mocked(configService.getOrThrow).mockReturnValue('tenant-123');
      vi.mocked(authRepository.findUser).mockResolvedValue(null);
      vi.mocked(argon2.hash).mockResolvedValue('hashed-password' as never);
      vi.mocked(authRepository.create).mockResolvedValue({
        id: 'user-1',
        tenantId: 'tenant-123',
        name: 'John Doe',
        code: 'USER',
      } as any);
      vi.mocked(jwtService.signAsync).mockResolvedValue(
        'mock-access-token' as never,
      );

      const result = await service.register(registerDto as any);

      expect(argon2.hash).toHaveBeenCalledWith('password123');
      expect(authRepository.create).toHaveBeenCalledWith(
        'tenant-123',
        expect.objectContaining({
          name: 'John Doe',
          password: 'hashed-password',
          code: 'USER',
        }),
      );
      expect(result.access_token).toBe('mock-access-token');
      expect(result.user.name).toBe('John Doe');
    });

    it('should not expose password in returned user object', async () => {
      vi.mocked(configService.getOrThrow).mockReturnValue('tenant-123');
      vi.mocked(authRepository.findUser).mockResolvedValue(null);
      vi.mocked(argon2.hash).mockResolvedValue('hashed-password' as never);
      vi.mocked(authRepository.create).mockResolvedValue({
        id: 'user-1',
        tenantId: 'tenant-123',
        name: 'John Doe',
        code: 'USER',
        password: 'hashed-password',
      } as any);
      vi.mocked(jwtService.signAsync).mockResolvedValue(
        'mock-access-token' as never,
      );

      const result = await service.register(registerDto as any);

      expect(result.user).not.toHaveProperty('password');
    });
  });

  describe('login', () => {
    const loginDto = { name: 'John Doe', password: 'password123' };

    it('should throw ConflictException when user not found', async () => {
      vi.mocked(configService.getOrThrow).mockReturnValue('tenant-123');
      vi.mocked(authRepository.findUser).mockResolvedValue(null);

      await expect(service.login(loginDto as any)).rejects.toThrow(
        ConflictException,
      );
    });

    it('should throw ConflictException when password is invalid', async () => {
      vi.mocked(configService.getOrThrow).mockReturnValue('tenant-123');
      vi.mocked(authRepository.findUser).mockResolvedValue({
        id: 'user-1',
        name: 'John Doe',
        password: 'hashed-password',
      } as any);
      vi.mocked(argon2.verify).mockResolvedValue(false as never);

      await expect(service.login(loginDto as any)).rejects.toThrow(
        ConflictException,
      );
    });

    it('should return access token when login successful', async () => {
      vi.mocked(configService.getOrThrow).mockReturnValue('tenant-123');
      vi.mocked(authRepository.findUser).mockResolvedValue({
        id: 'user-1',
        tenantId: 'tenant-123',
        name: 'John Doe',
        code: 'USER',
        password: 'hashed-password',
      } as any);
      vi.mocked(argon2.verify).mockResolvedValue(true as never);
      vi.mocked(jwtService.signAsync).mockResolvedValue(
        'mock-access-token' as never,
      );

      const result = await service.login(loginDto as any);

      expect(argon2.verify).toHaveBeenCalledWith(
        'hashed-password',
        'password123',
      );
      expect(result.access_token).toBe('mock-access-token');
      expect(result.user.name).toBe('John Doe');
    });
  });
});
