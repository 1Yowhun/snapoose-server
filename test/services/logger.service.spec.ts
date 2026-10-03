import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Test, TestingModule } from '@nestjs/testing';
import { WINSTON_MODULE_PROVIDER } from 'nest-winston';
import { AppLogger } from '../../src/common/logger.service.js';

describe('AppLogger', () => {
  let appLogger: AppLogger;
  let mockWinston: {
    info: ReturnType<typeof vi.fn>;
    error: ReturnType<typeof vi.fn>;
    warn: ReturnType<typeof vi.fn>;
    debug: ReturnType<typeof vi.fn>;
    verbose: ReturnType<typeof vi.fn>;
  };

  beforeEach(async () => {
    mockWinston = {
      info: vi.fn(),
      error: vi.fn(),
      warn: vi.fn(),
      debug: vi.fn(),
      verbose: vi.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AppLogger,
        { provide: WINSTON_MODULE_PROVIDER, useValue: mockWinston },
      ],
    }).compile();

    appLogger = module.get<AppLogger>(AppLogger);
    vi.clearAllMocks();
  });

  it('should be defined', () => {
    expect(appLogger).toBeDefined();
  });

  it('should call winston.info on log()', () => {
    appLogger.log('test log', 'TestContext');
    expect(mockWinston.info).toHaveBeenCalledWith('test log', { context: 'TestContext' });
  });

  it('should call winston.info on info()', () => {
    appLogger.info('test info', 'TestContext');
    expect(mockWinston.info).toHaveBeenCalledWith('test info', { context: 'TestContext' });
  });

  it('should call winston.error on error()', () => {
    appLogger.error('test error', 'stack-trace', 'TestContext');
    expect(mockWinston.error).toHaveBeenCalledWith('test error', {
      trace: 'stack-trace',
      context: 'TestContext',
    });
  });

  it('should call winston.warn on warn()', () => {
    appLogger.warn('test warn', 'TestContext');
    expect(mockWinston.warn).toHaveBeenCalledWith('test warn', { context: 'TestContext' });
  });

  it('should call winston.debug on debug()', () => {
    appLogger.debug('test debug', 'TestContext');
    expect(mockWinston.debug).toHaveBeenCalledWith('test debug', { context: 'TestContext' });
  });

  it('should call winston.verbose on verbose()', () => {
    appLogger.verbose('test verbose', 'TestContext');
    expect(mockWinston.verbose).toHaveBeenCalledWith('test verbose', { context: 'TestContext' });
  });

  describe('logError', () => {
    it('should format Error instance with message and stack', () => {
      const error = new Error('Something went wrong');
      appLogger.logError('Operation failed', error, 'TestContext');

      expect(mockWinston.error).toHaveBeenCalledWith('Operation failed', {
        context: 'TestContext',
        error: 'Something went wrong',
        stack: error.stack,
      });
    });

    it('should format non-Error objects using String()', () => {
      appLogger.logError('Operation failed', 'String error message', 'TestContext');

      expect(mockWinston.error).toHaveBeenCalledWith('Operation failed', {
        context: 'TestContext',
        error: 'String error message',
      });
    });
  });
});
