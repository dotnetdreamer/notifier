import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { AppSettings } from './app-settings.entity';
import { AppSettingsService } from './app-settings.service';
import { AppSettingsController } from './app-settings.controller';

@Module({
  imports: [
    TypeOrmModule.forFeature([AppSettings])
  ],
  providers: [AppSettingsService],
  controllers: [AppSettingsController],
  exports: [AppSettingsService]
})
export class AppSettingsModule {}