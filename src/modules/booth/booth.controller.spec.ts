import { Test, TestingModule } from '@nestjs/testing';
import { BoothController } from './booth.controller.js';

describe('BoothController', () => {
  let controller: BoothController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [BoothController],
    }).compile();

    controller = module.get<BoothController>(BoothController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
