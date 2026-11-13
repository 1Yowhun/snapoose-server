import { SetMetadata } from '@nestjs/common';

export const IS_DEVICE_KEY = 'isDevice';
// Endpoint khusus desktop: wajib device token + header X-DEVICE-ID
export const DeviceOnly = () => SetMetadata(IS_DEVICE_KEY, true);
