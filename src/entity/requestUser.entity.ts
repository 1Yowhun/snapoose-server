export class RequestUser {
  type: 'user';
  sub: string;
  name: string;
  code: string;
  tenantId: string;
  iat: number;
  exp: number;
}

// Payload token desktop; tidak punya exp, dicabut lewat booths.device_token_id
export class RequestDevice {
  type: 'device';
  sub: string;
  tenantId: string;
  boothId: string;
  jti: string;
  iat: number;
  userId: string;
}
