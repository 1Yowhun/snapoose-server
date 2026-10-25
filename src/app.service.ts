import {
  BadRequestException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { AppLogger } from './common/logger.service.js';
import { AppRepository } from './app.repository.js';

@Injectable()
export class AppService {
  constructor(
    private readonly logger: AppLogger,
    private readonly appRepository: AppRepository,
  ) {}

  async installationDevice(
    tenantId: string,
    serialNumber: string,
    dto: string[],
  ) {
    // TODO: disini install device , user login ketika sudah login, dia masukin location dan booth
    // ketika di post, maka serial number diupdate table booth, dan kita kasih 3 data,product,voucher,frame berdasarkan booth yang diisi
    const checkNumber = await this.appRepository.checkSerialNumber(
      serialNumber,
      tenantId,
    );
    if (!checkNumber)
      throw new NotFoundException('SerialNumber device was not founded');

    const data = await this.appRepository.getDataByBooth(
      tenantId,
      serialNumber,
      dto,
    );
    this.logger.debug(`Data retrieved: tenantId=${tenantId}`, AppService.name);
    return data;
  }
}
