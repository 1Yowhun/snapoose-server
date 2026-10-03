import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Test, TestingModule } from '@nestjs/testing';
import { FrameService } from '../../src/modules/cms/frame/frame.service.js';
import { FrameRepository } from '../../src/modules/cms/frame/frame.repository.js';
import { AppLogger } from '../../src/common/logger.service.js';
import { Frame } from '../../src/entity/frame.entity.js';
import { RequestUser } from '../../src/entity/requestUser.entity.js';

describe('FrameService', () => {
  let service: FrameService;
  let frameRepository: {
    createFrameObject: ReturnType<typeof vi.fn>;
    createFrameDB: ReturnType<typeof vi.fn>;
    getAllFrame: ReturnType<typeof vi.fn>;
    getAllCustomFrame: ReturnType<typeof vi.fn>;
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

  const mockFile = {
    originalname: 'frame-test.png',
    buffer: Buffer.from('fake-image-bytes'),
    mimetype: 'image/png',
  } as Express.Multer.File;

  beforeEach(async () => {
    frameRepository = {
      createFrameObject: vi.fn(),
      createFrameDB: vi.fn(),
      getAllFrame: vi.fn(),
      getAllCustomFrame: vi.fn(),
    };
    logger = {
      log: vi.fn(),
      logError: vi.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        FrameService,
        { provide: FrameRepository, useValue: frameRepository },
        { provide: AppLogger, useValue: logger },
      ],
    }).compile();

    service = module.get<FrameService>(FrameService);
    vi.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('postNormalFrame', () => {
    const normalFrameDto = {
      name: 'Classic Vintage',
      frameType: 'STRIP',
    };

    it('should upload frame image to R2 and save frame metadata to DB', async () => {
      frameRepository.createFrameObject.mockResolvedValue({
        key: 'frames/random-key.png',
        url: 'https://r2.example.com/frames/random-key.png',
      });

      const mockSavedFrame = new Frame({
        id: 'frame-1',
        name: normalFrameDto.name,
        frameType: normalFrameDto.frameType,
        imagePath: 'https://r2.example.com/frames/random-key.png',
        isActive: true,
        tenantId: mockUser.tenantId,
        code: 'FRM-12345',
        createdBy: mockUser.sub,
        updatedBy: mockUser.sub,
      });

      frameRepository.createFrameDB.mockResolvedValue(mockSavedFrame);

      const result = await service.postNormalFrame(mockFile, normalFrameDto, mockUser);

      expect(frameRepository.createFrameObject).toHaveBeenCalledWith(
        expect.stringMatching(/^frames\/.*-frame-test\.png$/),
        mockFile.buffer,
        mockFile.mimetype,
      );

      expect(frameRepository.createFrameDB).toHaveBeenCalledWith(
        expect.objectContaining({
          ...normalFrameDto,
          tenantId: mockUser.tenantId,
          imagePath: 'https://r2.example.com/frames/random-key.png',
          isActive: true,
          validFrom: null,
          validUntil: null,
          createdBy: mockUser.sub,
          updatedBy: mockUser.sub,
          code: expect.stringMatching(/^FRM-/),
        }),
      );

      expect(logger.log).toHaveBeenCalledWith('Frame berhasil dibuat', FrameService.name);
      expect(result).toEqual(mockSavedFrame);
    });

    it('should catch error, log it, and rethrow when R2 upload fails', async () => {
      const uploadError = new Error('R2 S3 upload failed');
      frameRepository.createFrameObject.mockRejectedValue(uploadError);

      await expect(
        service.postNormalFrame(mockFile, normalFrameDto, mockUser),
      ).rejects.toThrow('R2 S3 upload failed');

      expect(frameRepository.createFrameDB).not.toHaveBeenCalled();
      expect(logger.logError).toHaveBeenCalledWith(
        'Terjadi masalah ketika membuat Frame',
        uploadError,
        FrameService.name,
      );
    });

    it('should catch error, log it, and rethrow when DB save fails', async () => {
      frameRepository.createFrameObject.mockResolvedValue({
        url: 'https://r2.example.com/test.png',
      });
      const dbError = new Error('Firestore insert failed');
      frameRepository.createFrameDB.mockRejectedValue(dbError);

      await expect(
        service.postNormalFrame(mockFile, normalFrameDto, mockUser),
      ).rejects.toThrow('Firestore insert failed');

      expect(logger.logError).toHaveBeenCalledWith(
        'Terjadi masalah ketika membuat Frame',
        dbError,
        FrameService.name,
      );
    });
  });

  describe('postCustomFrame', () => {
    const customFrameDtoWithDates = {
      name: 'Halloween Limited',
      validFrom: new Date('2026-10-25T00:00:00.000Z'),
      validUntil: new Date('2026-10-31T23:59:59.000Z'),
    };

    it('should upload custom frame and save with CUSTOM frameType and parsed date range', async () => {
      frameRepository.createFrameObject.mockResolvedValue({
        url: 'https://r2.example.com/custom.png',
      });

      const mockSavedCustomFrame = new Frame({
        id: 'frame-custom-1',
        name: customFrameDtoWithDates.name,
        frameType: 'CUSTOM',
        imagePath: 'https://r2.example.com/custom.png',
        validFrom: customFrameDtoWithDates.validFrom,
        validUntil: customFrameDtoWithDates.validUntil,
        isActive: true,
      });

      frameRepository.createFrameDB.mockResolvedValue(mockSavedCustomFrame);

      const result = await service.postCustomFrame(mockFile, customFrameDtoWithDates, mockUser);

      expect(frameRepository.createFrameDB).toHaveBeenCalledWith(
        expect.objectContaining({
          name: 'Halloween Limited',
          frameType: 'CUSTOM',
          imagePath: 'https://r2.example.com/custom.png',
          validFrom: new Date('2026-10-25T00:00:00.000Z'),
          validUntil: new Date('2026-10-31T23:59:59.000Z'),
          code: expect.stringMatching(/^FRM-/),
          isActive: true,
        }),
      );

      expect(logger.log).toHaveBeenCalledWith('Custom Frame berhasil dibuat', FrameService.name);
      expect(result).toEqual(mockSavedCustomFrame);
    });

    it('should handle optional validFrom and validUntil as null when omitted', async () => {
      frameRepository.createFrameObject.mockResolvedValue({
        url: 'https://r2.example.com/custom-nodates.png',
      });

      frameRepository.createFrameDB.mockResolvedValue(new Frame({ id: 'frame-2' }));

      await service.postCustomFrame(mockFile, { name: 'No Dates Custom' }, mockUser);

      expect(frameRepository.createFrameDB).toHaveBeenCalledWith(
        expect.objectContaining({
          validFrom: null,
          validUntil: null,
        }),
      );
    });

    it('should catch error, log it, and rethrow when custom frame creation fails', async () => {
      const error = new Error('Custom frame creation failed');
      frameRepository.createFrameObject.mockRejectedValue(error);

      await expect(
        service.postCustomFrame(mockFile, { name: 'Failing Frame' }, mockUser),
      ).rejects.toThrow('Custom frame creation failed');

      expect(logger.logError).toHaveBeenCalledWith(
        'Terjadi masalah ketika membuat Custom Frame',
        error,
        FrameService.name,
      );
    });
  });

  describe('getFrame', () => {
    it('should return list of standard frame URLs', async () => {
      const mockUrls = ['https://r2.example.com/frame1.png', 'https://r2.example.com/frame2.png'];
      frameRepository.getAllFrame.mockResolvedValue(mockUrls);

      const result = await service.getFrame();

      expect(frameRepository.getAllFrame).toHaveBeenCalled();
      expect(logger.log).toHaveBeenCalledWith('Frame berhasil diambil', FrameService.name);
      expect(result).toEqual(mockUrls);
    });

    it('should catch error, log it, and rethrow when fetching frames fails', async () => {
      const fetchError = new Error('Failed to retrieve frames');
      frameRepository.getAllFrame.mockRejectedValue(fetchError);

      await expect(service.getFrame()).rejects.toThrow('Failed to retrieve frames');
      expect(logger.logError).toHaveBeenCalledWith(
        'Terjadi masalah ketika membuat Frame',
        fetchError,
        FrameService.name,
      );
    });
  });

  describe('getCustomFrame', () => {
    it('should return list of active custom frames', async () => {
      const mockCustomFrames = [
        { code: 'FRM-1', name: 'Custom 1', frameType: 'CUSTOM' },
        { code: 'FRM-2', name: 'Custom 2', frameType: 'CUSTOM' },
      ];
      frameRepository.getAllCustomFrame.mockResolvedValue(mockCustomFrames);

      const result = await service.getCustomFrame();

      expect(frameRepository.getAllCustomFrame).toHaveBeenCalled();
      expect(logger.log).toHaveBeenCalledWith('Custom Frame berhasil diambil', FrameService.name);
      expect(result).toEqual(mockCustomFrames);
    });

    it('should catch error, log it, and rethrow when fetching custom frames fails', async () => {
      const fetchError = new Error('Failed to retrieve custom frames');
      frameRepository.getAllCustomFrame.mockRejectedValue(fetchError);

      await expect(service.getCustomFrame()).rejects.toThrow('Failed to retrieve custom frames');
      expect(logger.logError).toHaveBeenCalledWith(
        'Terjadi masalah ketika mengambil Custom Frame',
        fetchError,
        FrameService.name,
      );
    });
  });
});
