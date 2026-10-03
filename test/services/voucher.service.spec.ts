import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { VoucherService } from '../../src/modules/cms/voucher/voucher.service.js';
import { VoucherRepository } from '../../src/modules/cms/voucher/voucher.repository.js';
import { TenantRepository } from '../../src/modules/tenant/tenant.repository.js';
import { AppLogger } from '../../src/common/logger.service.js';
import { Voucher } from '../../src/entity/voucher.entity.js';
import { RequestUser } from '../../src/entity/requestUser.entity.js';

describe('VoucherService', () => {
  let service: VoucherService;
  let voucherRepository: {
    createVoucher: ReturnType<typeof vi.fn>;
    findVoucherById: ReturnType<typeof vi.fn>;
    updateVoucherById: ReturnType<typeof vi.fn>;
    getAllVoucherList: ReturnType<typeof vi.fn>;
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
    voucherRepository = {
      createVoucher: vi.fn(),
      findVoucherById: vi.fn(),
      updateVoucherById: vi.fn(),
      getAllVoucherList: vi.fn(),
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
        VoucherService,
        { provide: VoucherRepository, useValue: voucherRepository },
        { provide: TenantRepository, useValue: tenantRepository },
        { provide: AppLogger, useValue: logger },
      ],
    }).compile();

    service = module.get<VoucherService>(VoucherService);
    vi.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('postVoucher', () => {
    const createVoucherDto = {
      voucherCode: 'DISKON50',
      discountPercent: 50,
      quota: 100,
      usedCount: 0,
      validFrom: new Date('2026-10-01'),
      validUntil: new Date('2026-10-31'),
    };

    it('should create and return voucher when tenant is found', async () => {
      tenantRepository.findById.mockResolvedValue({ id: 'tenant-123', name: 'Tenant A' });

      const mockCreatedVoucher = new Voucher({
        id: 'voucher-1',
        ...createVoucherDto,
        code: 'VCH-12345',
        tenantId: 'tenant-123',
        isActive: true,
        createdBy: mockUser.sub,
        updatedBy: mockUser.sub,
      });

      voucherRepository.createVoucher.mockResolvedValue(mockCreatedVoucher);

      const result = await service.postVoucher(createVoucherDto, mockUser);

      expect(tenantRepository.findById).toHaveBeenCalledWith('tenant-123');
      expect(voucherRepository.createVoucher).toHaveBeenCalledWith(
        expect.objectContaining({
          voucherCode: 'DISKON50',
          discountPercent: 50,
          quota: 100,
          usedCount: 0,
          tenantId: 'tenant-123',
          isActive: true,
          code: expect.stringMatching(/^VCH-/),
          createdBy: mockUser.sub,
          updatedBy: mockUser.sub,
        }),
      );
      expect(logger.log).toHaveBeenCalledWith('Voucher berhasil dibuat', VoucherService.name);
      expect(result).toEqual(mockCreatedVoucher);
    });

    it('should throw NotFoundException when tenant is not found', async () => {
      tenantRepository.findById.mockResolvedValue(null);

      await expect(service.postVoucher(createVoucherDto, mockUser)).rejects.toThrow(
        new NotFoundException('Tenant tidak ditemukan'),
      );

      expect(voucherRepository.createVoucher).not.toHaveBeenCalled();
      expect(logger.logError).toHaveBeenCalledWith(
        'Terjadi masalah ketika membuat Voucher',
        expect.any(NotFoundException),
        VoucherService.name,
      );
    });

    it('should log and rethrow when voucher creation repository fails', async () => {
      tenantRepository.findById.mockResolvedValue({ id: 'tenant-123' });
      const repoError = new Error('Database write error');
      voucherRepository.createVoucher.mockRejectedValue(repoError);

      await expect(service.postVoucher(createVoucherDto, mockUser)).rejects.toThrow(
        'Database write error',
      );

      expect(logger.logError).toHaveBeenCalledWith(
        'Terjadi masalah ketika membuat Voucher',
        repoError,
        VoucherService.name,
      );
    });
  });

  describe('putVoucher', () => {
    const updateVoucherDto = {
      voucherCode: 'DISKON70',
      discountPercent: 70,
      quota: 150,
      usedCount: 5,
      isActive: true,
      validFrom: new Date('2026-10-01'),
      validUntil: new Date('2026-11-15'),
    };

    it('should successfully update voucher when both tenant and voucher exist', async () => {
      voucherRepository.findVoucherById.mockResolvedValue(
        new Voucher({ id: 'vch-doc-1', voucherCode: 'DISKON50' }),
      );
      tenantRepository.findById.mockResolvedValue({ id: 'tenant-123' });

      const mockUpdatedVoucher = new Voucher({
        id: 'vch-doc-1',
        ...updateVoucherDto,
        tenantId: 'tenant-123',
      });
      voucherRepository.updateVoucherById.mockResolvedValue(mockUpdatedVoucher);

      const result = await service.putVoucher(updateVoucherDto, mockUser, 'vch-doc-1');

      expect(voucherRepository.findVoucherById).toHaveBeenCalledWith('vch-doc-1');
      expect(tenantRepository.findById).toHaveBeenCalledWith('tenant-123');
      expect(voucherRepository.updateVoucherById).toHaveBeenCalledWith(
        'vch-doc-1',
        expect.objectContaining({
          ...updateVoucherDto,
          tenantId: 'tenant-123',
          updatedBy: mockUser.sub,
          updatedAt: expect.any(Date),
        }),
      );
      expect(logger.log).toHaveBeenCalledWith('Voucher berhasil diupdate', VoucherService.name);
      expect(result).toEqual(mockUpdatedVoucher);
    });

    it('should throw NotFoundException when tenant is not found during update', async () => {
      voucherRepository.findVoucherById.mockResolvedValue(new Voucher({ id: 'vch-doc-1' }));
      tenantRepository.findById.mockResolvedValue(null);

      await expect(service.putVoucher(updateVoucherDto, mockUser, 'vch-doc-1')).rejects.toThrow(
        new NotFoundException('Tenant tidak ditemukan'),
      );

      expect(voucherRepository.updateVoucherById).not.toHaveBeenCalled();
      expect(logger.logError).toHaveBeenCalledWith(
        'Terjadi masalah ketika update voucher',
        expect.any(NotFoundException),
        VoucherService.name,
      );
    });

    it('should throw NotFoundException when voucher is not found during update', async () => {
      voucherRepository.findVoucherById.mockResolvedValue(null);
      tenantRepository.findById.mockResolvedValue({ id: 'tenant-123' });

      await expect(service.putVoucher(updateVoucherDto, mockUser, 'vch-doc-1')).rejects.toThrow(
        new NotFoundException('Voucher tidak ditemukan'),
      );

      expect(voucherRepository.updateVoucherById).not.toHaveBeenCalled();
      expect(logger.logError).toHaveBeenCalledWith(
        'Terjadi masalah ketika update voucher',
        expect.any(NotFoundException),
        VoucherService.name,
      );
    });

    it('should log and rethrow when repository update fails', async () => {
      voucherRepository.findVoucherById.mockResolvedValue(new Voucher({ id: 'vch-doc-1' }));
      tenantRepository.findById.mockResolvedValue({ id: 'tenant-123' });
      const updateError = new Error('Firestore update failed');
      voucherRepository.updateVoucherById.mockRejectedValue(updateError);

      await expect(service.putVoucher(updateVoucherDto, mockUser, 'vch-doc-1')).rejects.toThrow(
        'Firestore update failed',
      );

      expect(logger.logError).toHaveBeenCalledWith(
        'Terjadi masalah ketika update voucher',
        updateError,
        VoucherService.name,
      );
    });
  });

  describe('getVoucher', () => {
    it('should return list of all vouchers', async () => {
      const mockVouchers = [
        new Voucher({ id: 'vch-1', voucherCode: 'CODE1' }),
        new Voucher({ id: 'vch-2', voucherCode: 'CODE2' }),
      ];

      voucherRepository.getAllVoucherList.mockResolvedValue(mockVouchers);

      const result = await service.getVoucher();

      expect(voucherRepository.getAllVoucherList).toHaveBeenCalled();
      expect(logger.log).toHaveBeenCalledWith('Voucher berhasil diget', VoucherService.name);
      expect(result).toEqual(mockVouchers);
    });

    it('should log error and rethrow when getting vouchers fails', async () => {
      const getError = new Error('Firestore get error');
      voucherRepository.getAllVoucherList.mockRejectedValue(getError);

      await expect(service.getVoucher()).rejects.toThrow('Firestore get error');
      expect(logger.logError).toHaveBeenCalledWith(
        'Terjadi masalah ketika mengambil data voucher',
        getError,
        VoucherService.name,
      );
    });
  });
});
