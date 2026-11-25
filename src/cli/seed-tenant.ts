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

  // untuk menghasilkan hasil json
  const { values } = parseArgs({
    options: {
      name: { type: 'string' },
      brand: { type: 'string' },
      about: { type: 'string' },
      logo: { type: 'string' },
    },
  });

  // error checking apakah ada di cli nya
  if (!values.name || !values.brand || !values.about || !values.logo) {
    throw new Error('Usage: --name --brand --about --logo <path>');
  }

  // ambil extension file nya buat lowercase yang sesuai dengan tipe MIME_BY_EXT serta error checkign
  const mimetype = MIME_BY_EXT[extname(values.logo).toLowerCase()];
  if (!mimetype) throw new Error('Logo must be .png, .jpg, or .jpeg');

  // mengambil infromasi file, bisa size, isfile dst
  if (statSync(values.logo).size > MAX_SIZE) throw new Error('Logo exceeds 5MB');

  // ubah json dto menjadi class instance dengan values
  const dto = plainToInstance(CreateTenantDto, {
    name: values.name,
    brandName: values.brand,
    about: values.about,
  });
  // error checking
  const errors = await validate(dto, { whitelist: true, forbidNonWhitelisted: true });
  if (errors.length) {
    throw new Error(errors.flatMap((e) => Object.values(e.constraints ?? {})).join('; '));
  }

  // buat nest Standalone tanpa port, cocok buat script(cli), cron job, workers, dan bot
  const app = await NestFactory.createApplicationContext(SeedModule, {
    logger: ['error', 'warn'],
  });
  try {
    // ubah jadi buffer dan berikan mimetype seperti image/png dst.
    const file = { buffer: readFileSync(values.logo), mimetype } as Express.Multer.File;

    // ambil service yang ingin di trigger 
    const tenant = await app.get(TenantService, { strict: false }).postTenant(file, dto);
    console.log('Tenant created:', tenant.id);
  } finally {
    // diakhiri dengan app close
    await app.close();
  }
}

// kalau ada error maka console.error dan terminated cli nya 
main().catch((err) => {
  console.error(err.message ?? err);
  process.exit(1);
});