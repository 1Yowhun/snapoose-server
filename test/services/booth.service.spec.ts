import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { BoothService } from '../../src/modules/booth/booth.service.js';
import { BoothRepository } from '../../src/modules/booth/booth.repository.js';
import { TenantRepository } from '../../src/modules/tenant/tenant.repository.js';
import { AppLogger } from '../../src/common/logger.service.js';
import { Booth } from '../../src/entity/booth.entity.js';
import { RequestUser } from '../../src/entity/requestUser.entity.js';

describe('BoothService', () => {
  let service: BoothService;
  let boothRepository: {
    findLocationById: ReturnType<typeof vi.fn>;
    create: ReturnType<typeof vi.fn>;
  };
  let tenantRepository: {
    findById: ReturnType<typeof vi.fn>;
  };
  let logger: {
    log: ReturnType<typeof vi.fn>;
    logError: ReturnType<typeof vi.fn>;
  };

  const mockUser: RequestUser = {
    sub: 'user-sub-123',
    name: 'Admin',
    code: 'USER-1',
    tenantId: 'tenant-123',
    iat: 12345678,
    exp: 123456789,
  };

  beforeEach(async () => {
    boothRepository = {
      findLocationById: vi.fn(),
      create: vi.fn(),
    };
    tenantRepository = {
      findById: vi.fn(),
    };
    logger = {
      log: vi.fn(),
      logError: vi.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        BoothService,
        { provide: BoothRepository, useValue: boothRepository },
        { provide: TenantRepository, useValue: tenantRepository },
        { provide: AppLogger, useValue: logger },
      ],
    }).compile();

    service = module.get<BoothService>(BoothService);
    vi.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('createBooth', () => {
    const createBoothDto = {
      name: 'Booth A1',
    };
    const locationId = 'loc-123';

    it('should successfully create and return booth when tenant and location exist', async () => {
      tenantRepository.findById.mockResolvedValue({ id: 'tenant-123', name: 'Tenant A' });
      boothRepository.findLocationById.mockResolvedValue({ id: 'loc-123', storeName: 'Mall A' });

      const mockCreatedBooth = new Booth({
        id: 'booth-1',
        name: createBoothDto.name,
        tenantId: mockUser.tenantId,
        code: 'BTH-12345',
        status: true,
        createdBy: mockUser.sub,
        updatedBy: mockUser.sub,
      });

      boothRepository.create.mockResolvedValue(mockCreatedBooth);

      const result = await service.createBooth(createBoothDto, mockUser, locationId);

      expect(tenantRepository.findById).toHaveBeenCalledWith('tenant-123');
      expect(boothRepository.findLocationById).toHaveBeenCalledWith('loc-123');
      expect(boothRepository.create).toHaveBeenCalledWith(
        'loc-123',
        expect.objectContaining({
          name: 'Booth A1',
          tenantId: 'tenant-123',
          code: expect.stringMatching(/^BTH-/),
          status: true,
          createdBy: mockUser.sub,
          updatedBy: mockUser.sub,
          installedAt: expect.any(Date),
          updatedAt: expect.any(Date),
        }),
      );
      expect(logger.log).toHaveBeenCalledWith('booth berhasil dibuat', BoothService.name);
      expect(result).toEqual(mockCreatedBooth);
    });

    it('should throw NotFoundException when tenant is not found', async () => {
      tenantRepository.findById.mockResolvedValue(null);
      boothRepository.findLocationById.mockResolvedValue({ id: 'loc-123' });

      await expect(service.createBooth(createBoothDto, mockUser, locationId)).rejects.toThrow(
        new NotFoundException('Tenant tidak ditemukan'),
      );

      expect(boothRepository.create).not.toHaveBeenCalled();
      expect(logger.logError).toHaveBeenCalledWith(
        'Terjadi masalah ketika membuat booth',
        expect.any(NotFoundException),
        BoothService.name,
      );
    });

    it('should throw NotFoundException when location is not found', async () => {
      tenantRepository.findById.mockResolvedValue({ id: 'tenant-123' });
      boothRepository.findLocationById.mockResolvedValue(null);

      await expect(service.createBooth(createBoothDto, mockUser, locationId)).rejects.toThrow(
        new NotFoundException('Location tidak ditemukan'),
      );

      expect(boothRepository.create).not.toHaveBeenCalled();
      expect(logger.logError).toHaveBeenCalledWith(
        'Terjadi masalah ketika membuat booth',
        expect.any(NotFoundException),
        BoothService.name,
      );
    });

    it('should log and rethrow when repository create fails', async () => {
      tenantRepository.findById.mockResolvedValue({ id: 'tenant-123' });
      boothRepository.findLocationById.mockResolvedValue({ id: 'loc-123' });
      const createError = new Error('Firestore transaction error');
      boothRepository.create.mockRejectedValue(createError);

      await expect(service.createBooth(createBoothDto, mockUser, locationId)).rejects.toThrow(
        'Firestore transaction error',
      );

      expect(logger.logError).toHaveBeenCalledWith(
        'Terjadi masalah ketika membuat booth',
        createError,
        BoothService.name,
      );
    });
  });
});
