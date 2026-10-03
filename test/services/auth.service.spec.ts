import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Test, TestingModule } from '@nestjs/testing';
import { ConflictException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as argon2 from 'argon2';
import { AuthService } from '../../src/modules/iam/auth/auth.service.js';
import { AuthRepository } from '../../src/modules/iam/auth/auth.repository.js';
import { AppLogger } from '../../src/common/logger.service.js';
import { User } from '../../src/entity/user.entity.js';

vi.mock('argon2', () => ({
  hash: vi.fn(),
  verify: vi.fn(),
}));

describe('AuthService', () => {
  let service: AuthService;
  let authRepository: {
    findUser: ReturnType<typeof vi.fn>;
    createUserWithUniqueName: ReturnType<typeof vi.fn>;
  };
  let jwtService: { signAsync: ReturnType<typeof vi.fn> };
  let configService: { getOrThrow: ReturnType<typeof vi.fn> };
  let logger: {
    log: ReturnType<typeof vi.fn>;
    warn: ReturnType<typeof vi.fn>;
    logError: ReturnType<typeof vi.fn>;
  };

  beforeEach(async () => {
    authRepository = {
      findUser: vi.fn(),
      createUserWithUniqueName: vi.fn(),
    };
    jwtService = {
      signAsync: vi.fn(),
    };
    configService = {
      getOrThrow: vi.fn().mockReturnValue('tenant-test-id'),
    };
    logger = {
      log: vi.fn(),
      warn: vi.fn(),
      logError: vi.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: AuthRepository, useValue: authRepository },
        { provide: JwtService, useValue: jwtService },
        { provide: ConfigService, useValue: configService },
        { provide: AppLogger, useValue: logger },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    vi.clearAllMocks();
    configService.getOrThrow.mockReturnValue('tenant-test-id');
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('register', () => {
    const registerDto = { name: '  John Doe  ', password: 'password123' };

    it('should hash password and create a new user successfully', async () => {
      const mockCreatedUser = new User({
        id: 'user-uuid-1',
        tenantId: 'tenant-test-id',
        name: 'john doe',
        code: 'USER-12345',
        password: 'hashed-password',
      });

      vi.mocked(argon2.hash).mockResolvedValue('hashed-password' as never);
      authRepository.createUserWithUniqueName.mockResolvedValue(mockCreatedUser);

      const result = await service.register(registerDto);

      expect(configService.getOrThrow).toHaveBeenCalledWith('DEFAULT_TENANT_ID');
      expect(argon2.hash).toHaveBeenCalledWith('password123');
      expect(authRepository.createUserWithUniqueName).toHaveBeenCalledWith(
        'tenant-test-id',
        'john doe',
        expect.objectContaining({
          tenantId: 'tenant-test-id',
          name: 'john doe',
          password: 'hashed-password',
          code: expect.stringMatching(/^USER-/),
        }),
      );
      expect(logger.log).toHaveBeenCalledWith('User berhasil dibuat', 'UserService');
      expect(result).toEqual({
        user: {
          id: 'user-uuid-1',
          tenantId: 'tenant-test-id',
          name: 'john doe',
          code: 'USER-12345',
        },
      });
      expect(result.user).not.toHaveProperty('password');
    });

    it('should rethrow ConflictException when username is already taken', async () => {
      vi.mocked(argon2.hash).mockResolvedValue('hashed-password' as never);
      authRepository.createUserWithUniqueName.mockRejectedValue(
        new ConflictException('Nama sudah terdaftar'),
      );

      await expect(service.register(registerDto)).rejects.toThrow(ConflictException);
      expect(logger.logError).toHaveBeenCalledWith(
        'Terjadi masalah ketika membuat User',
        expect.any(ConflictException),
        'UserService',
      );
    });

    it('should rethrow unexpected error and log it', async () => {
      const genericError = new Error('Database connection failed');
      vi.mocked(argon2.hash).mockRejectedValue(genericError);

      await expect(service.register(registerDto)).rejects.toThrow('Database connection failed');
      expect(logger.logError).toHaveBeenCalledWith(
        'Terjadi masalah ketika membuat User',
        genericError,
        'UserService',
      );
    });
  });

  describe('login', () => {
    const loginDto = { name: '  John Doe  ', password: 'password123' };

    it('should successfully log in and return user data with access_token', async () => {
      const mockUser = new User({
        id: 'user-uuid-1',
        tenantId: 'tenant-test-id',
        name: 'John Doe',
        code: 'USER-12345',
        password: 'hashed-password',
      });

      authRepository.findUser.mockResolvedValue(mockUser);
      vi.mocked(argon2.verify).mockResolvedValue(true as never);
      jwtService.signAsync.mockResolvedValue('mock-jwt-token');

      const result = await service.login(loginDto);

      expect(authRepository.findUser).toHaveBeenCalledWith('tenant-test-id', 'john doe');
      expect(argon2.verify).toHaveBeenCalledWith('hashed-password', 'password123');
      expect(jwtService.signAsync).toHaveBeenCalledWith({
        sub: 'user-uuid-1',
        name: 'John Doe',
        code: 'USER-12345',
        tenantId: 'tenant-test-id',
      });
      expect(logger.log).toHaveBeenCalledWith('User berhasil login', 'UserService');
      expect(result).toEqual({
        user: {
          id: 'user-uuid-1',
          name: 'John Doe',
          code: 'USER-12345',
          tenantId: 'tenant-test-id',
        },
        access_token: 'mock-jwt-token',
      });
    });

    it('should throw ConflictException when user is not found', async () => {
      authRepository.findUser.mockResolvedValue(null);

      await expect(service.login(loginDto)).rejects.toThrow(
        new ConflictException('Nama tidak ada, silahakan register'),
      );
      expect(logger.warn).toHaveBeenCalledWith('Login gagal, tidak ada nama', 'AuthService');
      expect(logger.logError).toHaveBeenCalledWith(
        'Terjadi masalah ketika login',
        expect.any(ConflictException),
        'UserService',
      );
    });

    it('should throw ConflictException when password does not match', async () => {
      const mockUser = new User({
        id: 'user-uuid-1',
        tenantId: 'tenant-test-id',
        name: 'John Doe',
        code: 'USER-12345',
        password: 'hashed-password',
      });

      authRepository.findUser.mockResolvedValue(mockUser);
      vi.mocked(argon2.verify).mockResolvedValue(false as never);

      await expect(service.login(loginDto)).rejects.toThrow(
        new ConflictException('Password salah'),
      );
      expect(logger.warn).toHaveBeenCalledWith('Login gagal, password salah', 'AuthService');
      expect(logger.logError).toHaveBeenCalledWith(
        'Terjadi masalah ketika login',
        expect.any(ConflictException),
        'UserService',
      );
    });

    it('should rethrow generic error and log it', async () => {
      const dbError = new Error('Firestore read failed');
      authRepository.findUser.mockRejectedValue(dbError);

      await expect(service.login(loginDto)).rejects.toThrow('Firestore read failed');
      expect(logger.logError).toHaveBeenCalledWith(
        'Terjadi masalah ketika login',
        dbError,
        'UserService',
      );
    });
  });
});
