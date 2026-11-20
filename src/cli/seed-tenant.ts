import { NestFactory } from '@nestjs/core';
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { WinstonModule } from 'nest-winston';
import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { readFileSync, statSync } from 'node:fs';
import { extname } from 'node:path';
import { parseArgs } from 'node:util';
import { winstonConfig } from '../common/logger.config.js';
import { CommonModule } from '../common/common.module.js';
import { ProviderModule } from '../shared/infra/provider.module.js';
import { TenantModule } from '../modules/tenant/tenant.module.js';
import { TenantService } from '../modules/tenant/tenant.service.js';
import { CreateTenantDto } from '../dto/tenant.dto.js';

const MIME_BY_EXT: Record<string, string> = {
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
};
const MAX_SIZE = 5 * 1024 * 1024;

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true, envFilePath: '.env' }),
    WinstonModule.forRoot(winstonConfig),
    ProviderModule,
    CommonModule,
    TenantModule,
  ],
})
class SeedModule {}

async function main() {
  const { values } = parseArgs({
    options: {
      name: { type: 'string' },
      brand: { type: 'string' },
      about: { type: 'string' },
      logo: { type: 'string' },
    },
  });
  if (!values.name || !values.brand || !values.about || !values.logo) {
    throw new Error('Usage: --name --brand --about --logo <path>');
  }

  const mimetype = MIME_BY_EXT[extname(values.logo).toLowerCase()];
  if (!mimetype) throw new Error('Logo must be .png, .jpg, or .jpeg');
  if (statSync(values.logo).size > MAX_SIZE) throw new Error('Logo exceeds 5MB');

  const dto = plainToInstance(CreateTenantDto, {
    name: values.name,
    brandName: values.brand,
    about: values.about,
  });
  const errors = await validate(dto, { whitelist: true, forbidNonWhitelisted: true });
  if (errors.length) {
    throw new Error(errors.flatMap((e) => Object.values(e.constraints ?? {})).join('; '));
  }

  const app = await NestFactory.createApplicationContext(SeedModule, {
    logger: ['error', 'warn'],
  });
  try {
    const file = { buffer: readFileSync(values.logo), mimetype } as Express.Multer.File;
    const tenant = await app.get(TenantService, { strict: false }).postTenant(file, dto);
    console.log('Tenant created:', tenant.id);
  } finally {
    await app.close();
  }
}

main().catch((err) => {
  console.error(err.message ?? err);
  process.exit(1);
});