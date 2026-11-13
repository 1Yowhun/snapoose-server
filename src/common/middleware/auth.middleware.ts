import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { IS_PUBLIC_KEY } from '../decorators/public.decorator.js';
import { Reflector } from '@nestjs/core';
import { Request } from 'express';
import { createDecipheriv } from 'node:crypto';
import { IS_DEVICE_KEY } from '../decorators/device.decorator.js';
import { AppRepository } from '../../app.repository.js';

@Injectable()
export class AuthGuard implements CanActivate {
  private readonly secretKey: Buffer;
  constructor(
    private readonly jwt: JwtService,
    private reflector: Reflector,
    private readonly configService: ConfigService,
    private readonly appRepository: AppRepository,
  ) {
    const key = this.configService.get<string>('ENCRYPTION_KEY');
    if (!key)
      throw new UnauthorizedException('Encryption key is not configured');
    this.secretKey = Buffer.from(key, 'hex');
  }

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (isPublic) return true;

    const request = context.switchToHttp().getRequest();
    const encryptedToken = this.extractTokenFromHeader(request);

    if (!encryptedToken)
      throw new UnauthorizedException('Authentication token is required');

    let payload: any;
    try {
      const rawJwt = this.decryptToken(encryptedToken);
      payload = await this.jwt.verifyAsync(rawJwt);
    } catch {
      throw new UnauthorizedException(
        'Invalid or expired authentication token',
      );
    }

    const isDeviceRoute =
      this.reflector.getAllAndOverride<boolean>(IS_DEVICE_KEY, [
        context.getHandler(),
        context.getClass(),
      ]) ?? false;
    const isDeviceToken = payload.type === 'device';


    // Device token hanya untuk endpoint desktop, user token sebaliknya
    if (isDeviceRoute !== isDeviceToken) {
      throw new ForbiddenException(
        isDeviceRoute
          ? 'This endpoint requires a device token'
          : 'Device token is not allowed for this endpoint',
      );
    }

    if (isDeviceToken) await this.verifyDevice(request, payload);

    request['user'] = payload;
    return true;
  }

  private async verifyDevice(request: Request, payload: any) {
    const deviceId = request.headers['x-device-id'];
    if (typeof deviceId !== 'string' || deviceId.trim() !== payload.sub)
      throw new UnauthorizedException('X-DEVICE-ID does not match the token');

    if (!payload.jti || !payload.tenantId)
      throw new UnauthorizedException('Invalid device token');

    const active = await this.appRepository.isDeviceTokenActive(
      payload.tenantId,
      payload.sub,
      payload.jti,
    );
    if (!active)
      throw new UnauthorizedException('Device token has been revoked');
  }

  private extractTokenFromHeader(request: Request): string | undefined {
    const [type, token] = request.headers.authorization?.split(' ') ?? [];
    return type === 'Bearer' ? token : undefined;
  }

  private decryptToken(encryptedToken: string): string {
    const parts = encryptedToken.split(':');
    if (parts.length !== 3) {
      throw new Error('Invalid token format');
    }

    const [ivHex, authTagHex, ciphertextHex] = parts;

    const iv = Buffer.from(ivHex, 'hex');
    const authTag = Buffer.from(authTagHex, 'hex');
    const ciphertext = Buffer.from(ciphertextHex, 'hex');

    const decipher = createDecipheriv('aes-256-gcm', this.secretKey, iv);
    decipher.setAuthTag(authTag);

    let decrypted = decipher.update(ciphertext, undefined, 'utf8');
    decrypted += decipher.final('utf8');

    return decrypted;
  }
}
