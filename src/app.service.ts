import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { randomUUID } from 'node:crypto';
import { AppLogger } from './common/logger.service.js';
import { AppRepository } from './app.repository.js';
import { RequestUser } from './entity/requestUser.entity.js';
import { CreateInstallDto } from './dto/install.dto.js';
import { encryptAccessToken } from './common/utils/encrypt.js';

@Injectable()
export class AppService {
  constructor(
    private readonly logger: AppLogger,
    private readonly appRepository: AppRepository,
    private readonly jwt: JwtService,
    private readonly configService: ConfigService,
  ) {}

  async installationDevice(
    user: RequestUser,
    serialNumber: string,
    dto: CreateInstallDto,
  ) {
    const deviceId = serialNumber?.trim();
    if (!deviceId) throw new BadRequestException('X-DEVICE-ID is required');
    if (deviceId.length > 50)
      throw new BadRequestException(
        'X-DEVICE-ID must not exceed 50 characters',
      );

    const booths = await this.appRepository.findInstallableBooths(
      user.tenantId,
      dto.locationId,
      dto.boothId,
    );
    if (!booths)
      throw new NotFoundException(
        'Booth was not founded, inactive, or outside the selected locations',
      );

    // jti baru menggantikan token lama device/booth ini
    const tokenId = randomUUID();
    await this.appRepository.bindDevice(
      user.tenantId,
      deviceId,
      dto.boothId,
      tokenId,
      user.sub,
    );

    const catalog = await this.appRepository.getDataByBooth(
      user.tenantId,
      dto.boothId,
    );

    // Tanpa expiresIn: device token tidak expired, validitas dicek di AuthGuard
    const deviceToken = await this.jwt.signAsync(
      {
        type: 'device',
        sub: deviceId,
        tenantId: user.tenantId,
        boothId: dto.boothId,
        userId: user.sub,
      },
      { jwtid: tokenId },
    );
    const encryptedTokenDevice = encryptAccessToken(
      deviceToken,
      this.configService.getOrThrow<string>('ENCRYPTION_KEY'),
    );

    this.logger.log(
      `Device installed: deviceId=${deviceId} tenantId=${user.tenantId} boothIds=${dto.boothId} userId=${user.sub}`,
      AppService.name,
    );
    return { ...catalog, encryptedTokenDevice };
  }
}
