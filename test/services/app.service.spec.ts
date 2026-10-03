import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException } from '@nestjs/common';
import { AppService } from '../../src/app.service.js';

describe('AppService', () => {
  let service: AppService;
  let mockFirestore: {
    collection: ReturnType<typeof vi.fn>;
  };
  let mockCollection: {
    add: ReturnType<typeof vi.fn>;
  };

  beforeEach(async () => {
    mockCollection = {
      add: vi.fn(),
    };
    mockFirestore = {
      collection: vi.fn().mockReturnValue(mockCollection),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AppService,
        { provide: 'FIRESTORE', useValue: mockFirestore },
      ],
    }).compile();

    service = module.get<AppService>(AppService);
    vi.clearAllMocks();
    mockFirestore.collection.mockReturnValue(mockCollection);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('createUser', () => {
    it('should create user document in Firestore and return id and name', async () => {
      mockCollection.add.mockResolvedValue({ id: 'doc-id-123' });

      const result = await service.createUser('Alice');

      expect(mockFirestore.collection).toHaveBeenCalledWith('users');
      expect(mockCollection.add).toHaveBeenCalledWith(
        expect.objectContaining({
          name: 'Alice',
          created_by: expect.any(Date),
        }),
      );
      expect(result).toEqual({ id: 'doc-id-123', name: 'Alice' });
    });

    it('should throw BadRequestException when name is empty', async () => {
      await expect(service.createUser('')).rejects.toThrow(
        new BadRequestException('Query parameter "name" wajib diisi'),
      );
      expect(mockFirestore.collection).not.toHaveBeenCalled();
    });

    it('should rethrow error when Firestore add fails', async () => {
      mockCollection.add.mockRejectedValue(new Error('Firestore write failure'));

      await expect(service.createUser('Bob')).rejects.toThrow('Firestore write failure');
    });
  });
});
