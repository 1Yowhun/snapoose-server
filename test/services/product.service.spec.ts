import { describe, it, expect, vi, beforeEach } from 'vitest';
import { RequestUser } from '../../src/entity/requestUser.entity.js';
import { Test, TestingModule } from '@nestjs/testing';
import { Product } from '../../src/entity/product.entity.js';
import { ProductService } from '../../src/modules/cms/product/product.service.js';
import { ProductRepository } from '../../src/modules/cms/product/product.repository.js';
import { AppLogger } from '../../src/common/logger.service.js';

describe('ProductService', () => {
  let service: ProductService;
  let productRepository: {
    createProduct: ReturnType<typeof vi.fn>;
    getAllProductList: ReturnType<typeof vi.fn>;
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
    productRepository = {
      createProduct: vi.fn(),
      getAllProductList: vi.fn()
    };
    logger = {
      log: vi.fn(),
      logError: vi.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ProductService,
        { provide: ProductRepository, useValue: productRepository },
        { provide: AppLogger, useValue: logger },
      ],
    }).compile();

    service = module.get<ProductService>(ProductService);
    vi.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('postProduct', () => {
    const createProductDto = {
      name: 'Harga Asta',
      price: 35000,
    };

    it('should create product and return a Product when tenant exists', async () => {
      const mockCreatedProduct = new Product({
        id: 'loc-uuid-1',
        code: 'PRD-ABCDE',
        tenantId: 'tenant-123',
        name: createProductDto.name,
        price: createProductDto.price,
        includedPrintQuantity: 2,
        isPrintable: true,
        isActive: true,
        createdBy: mockUser.sub,
        updatedBy: mockUser.sub,
      });
      productRepository.createProduct.mockResolvedValue(mockCreatedProduct);

      const result = await service.postProduct(createProductDto, mockUser);

      expect(productRepository.createProduct).toHaveBeenCalledWith(
        expect.objectContaining({
          ...createProductDto,
          tenantId: 'tenant-123',
          code: expect.stringMatching(/^PRD-/),
          isActive: true,
          includedPrintQuantity: 2,
          isPrintable: true,
          createdBy: mockUser.sub,
          updatedBy: mockUser.sub,
          createdAt: expect.any(Date),
          updatedAt: expect.any(Date),
        }),
      );
      expect(logger.log).toHaveBeenCalledWith('Product berhasil dibuat', ProductService.name);
      expect(result).toEqual(mockCreatedProduct);
    });

    it('should log and rethrow when repository create fails', async () => {
      const dbError = new Error('Database write error');
      productRepository.createProduct.mockRejectedValue(dbError);

      await expect(service.postProduct(createProductDto, mockUser)).rejects.toThrow(
        'Database write error',
      );

      expect(logger.logError).toHaveBeenCalledWith(
        'Terjadi masalah ketika membuat Product',
        dbError,
        ProductService.name,
      );
    });
  });

  describe('getProduct', () => {
    it('should return list of all Products', async () => {
      const mockProducts = [
        new Product({
          id: 'prod-1',
          code: 'PRD-001',
          tenantId: 'tenant-123',
          name: 'Paket Foto Reguler',
          price: 35000,
          includedPrintQuantity: 2,
          isPrintable: true,
          isActive: true,
          createdBy: mockUser.sub,
          updatedBy: mockUser.sub,
          createdAt: new Date('2026-10-01T08:00:00.000Z'),
          updatedAt: new Date('2026-10-01T08:00:00.000Z'),
        }),
        new Product({
          id: 'prod-2',
          code: 'PRD-002',
          tenantId: 'tenant-123',
          name: 'Paket Foto Premium',
          price: 50000,
          includedPrintQuantity: 4,
          isPrintable: true,
          isActive: true,
          createdBy: mockUser.sub,
          updatedBy: mockUser.sub,
          createdAt: new Date('2026-10-02T08:00:00.000Z'),
          updatedAt: new Date('2026-10-02T08:00:00.000Z'),
        }),
      ];

      productRepository.getAllProductList.mockResolvedValue(mockProducts);

      const result = await service.getProduct();

      expect(productRepository.getAllProductList).toHaveBeenCalled();
      expect(logger.log).toHaveBeenCalledWith('Product berhasil diambil', ProductService.name);
      expect(result).toEqual(mockProducts);
    });

    it('should log error and rethrow when getting products fails', async () => {
      const getError = new Error('Firestore get error');
      productRepository.getAllProductList.mockRejectedValue(getError);

      await expect(service.getProduct()).rejects.toThrow('Firestore get error');
      expect(logger.logError).toHaveBeenCalledWith(
        'Terjadi masalah ketika mengambil data Product',
        getError,
        ProductService.name,
      );
    });
  });
});