import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Test, TestingModule } from '@nestjs/testing';
import { RoleService } from '../../src/modules/iam/role/role.service.js';
import { RoleRepository } from '../../src/modules/iam/role/role.repository.js';
import { AppLogger } from '../../src/common/logger.service.js';
import { Role } from '../../src/modules/iam/role/entity/role.entity.js';

describe('RoleService', () => {
  let service: RoleService;
  let roleRepository: {
    save: ReturnType<typeof vi.fn>;
  };
  let logger: {
    log: ReturnType<typeof vi.fn>;
    logError: ReturnType<typeof vi.fn>;
  };

  beforeEach(async () => {
    roleRepository = {
      save: vi.fn(),
    };
    logger = {
      log: vi.fn(),
      logError: vi.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RoleService,
        { provide: RoleRepository, useValue: roleRepository },
        { provide: AppLogger, useValue: logger },
      ],
    }).compile();

    service = module.get<RoleService>(RoleService);
    vi.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('createRole', () => {
    const createRoleDto = {
      code: 'ADMIN',
      name: 'Administrator',
      isSystemRole: true,
    };

    it('should create and save a new role successfully', async () => {
      roleRepository.save.mockImplementation(async (role: Role) => role);

      const result = await service.createRole(createRoleDto);

      expect(logger.log).toHaveBeenCalledWith('Membuat role baru: ADMIN', 'RoleService');
      expect(roleRepository.save).toHaveBeenCalledWith(
        expect.objectContaining({
          code: 'ADMIN',
          name: 'Administrator',
          isSystemRole: true,
          isActive: true,
          tenantId: 'C3fc398yo17wMO8521',
          id: expect.any(String),
          createdAt: expect.any(Date),
        }),
      );
      expect(logger.log).toHaveBeenCalledWith(
        expect.stringMatching(/^Role berhasil dibuat: /),
        'RoleService',
      );
      expect(result).toMatchObject({
        code: 'ADMIN',
        name: 'Administrator',
        isSystemRole: true,
        isActive: true,
      });
    });

    it('should log error and rethrow when saving role fails', async () => {
      const dbError = new Error('Database save failure');
      roleRepository.save.mockRejectedValue(dbError);

      await expect(service.createRole(createRoleDto)).rejects.toThrow('Database save failure');
      expect(logger.logError).toHaveBeenCalledWith('Gagal membuat Role', dbError, 'Role Service');
    });
  });
});
