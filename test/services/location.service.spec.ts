import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { LocationService } from '../../src/modules/location/location.service.js';
import { LocationRepository } from '../../src/modules/location/location.repository.js';
import { TenantRepository } from '../../src/modules/tenant/tenant.repository.js';
import { AppLogger } from '../../src/common/logger.service.js';
import { Location } from '../../src/entity/location.entity.js';
import { RequestUser } from '../../src/entity/requestUser.entity.js';

describe('LocationService', () => {
  let service: LocationService;
  let locationRepository: {
    create: ReturnType<typeof vi.fn>;
    getLocationData: ReturnType<typeof vi.fn>;
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
    locationRepository = {
      create: vi.fn(),
      getLocationData: vi.fn(),
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
        LocationService,
        { provide: LocationRepository, useValue: locationRepository },
        { provide: TenantRepository, useValue: tenantRepository },
        { provide: AppLogger, useValue: logger },
      ],
    }).compile();

    service = module.get<LocationService>(LocationService);
    vi.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('createLocation', () => {
    const createLocationDto = {
      storeName: 'Grand Indonesia',
      nameBooth: 'Booth Level 3',
      street: 'Jl. M.H. Thamrin No. 1',
    };

    it('should create and return a location when tenant exists', async () => {
      tenantRepository.findById.mockResolvedValue({ id: 'tenant-123', name: 'Tenant A' });

      const mockCreatedLocation = new Location({
        id: 'loc-uuid-1',
        tenantId: 'tenant-123',
        code: 'LOK-ABCDE',
        storeName: createLocationDto.storeName,
        nameBooth: createLocationDto.nameBooth,
        street: createLocationDto.street,
        isActive: true,
        createdBy: mockUser.sub,
        updatedBy: mockUser.sub,
      });

      locationRepository.create.mockResolvedValue(mockCreatedLocation);

      const result = await service.createLocation(createLocationDto, mockUser);

      expect(tenantRepository.findById).toHaveBeenCalledWith('tenant-123');
      expect(locationRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          ...createLocationDto,
          tenantId: 'tenant-123',
          code: expect.stringMatching(/^LOK-/),
          isActive: true,
          createdBy: mockUser.sub,
          updatedBy: mockUser.sub,
          createdAt: expect.any(Date),
          updatedAt: expect.any(Date),
        }),
      );
      expect(logger.log).toHaveBeenCalledWith('Location berhasil dibuat', LocationService.name);
      expect(result).toEqual(mockCreatedLocation);
    });

    it('should throw NotFoundException when tenant is not found', async () => {
      tenantRepository.findById.mockResolvedValue(null);

      await expect(service.createLocation(createLocationDto, mockUser)).rejects.toThrow(
        new NotFoundException('Tenant tidak ditemukan'),
      );

      expect(locationRepository.create).not.toHaveBeenCalled();
      expect(logger.logError).toHaveBeenCalledWith(
        'Terjadi masalah ketika membuat Location',
        expect.any(NotFoundException),
        LocationService.name,
      );
    });

    it('should log and rethrow when repository create fails', async () => {
      tenantRepository.findById.mockResolvedValue({ id: 'tenant-123' });
      const dbError = new Error('Database write error');
      locationRepository.create.mockRejectedValue(dbError);

      await expect(service.createLocation(createLocationDto, mockUser)).rejects.toThrow(
        'Database write error',
      );

      expect(logger.logError).toHaveBeenCalledWith(
        'Terjadi masalah ketika membuat Location',
        dbError,
        LocationService.name,
      );
    });
  });

  describe('getLocationList', () => {
    it('should return a list of locations and log success', async () => {
      const mockLocations = [
        new Location({ id: 'loc-1', storeName: 'Mall A' }),
        new Location({ id: 'loc-2', storeName: 'Mall B' }),
      ];

      locationRepository.getLocationData.mockResolvedValue(mockLocations);

      const result = await service.getLocationList();

      expect(locationRepository.getLocationData).toHaveBeenCalled();
      expect(logger.log).toHaveBeenCalledWith('Location berhasil diambil', LocationService.name);
      expect(result).toEqual(mockLocations);
    });

    it('should log error and rethrow when fetching fails', async () => {
      const fetchError = new Error('Firestore connection failure');
      locationRepository.getLocationData.mockRejectedValue(fetchError);

      await expect(service.getLocationList()).rejects.toThrow('Firestore connection failure');
      expect(logger.logError).toHaveBeenCalledWith(
        'Terjadi masalah ketika mengambil Location',
        fetchError,
        LocationService.name,
      );
    });
  });
});
