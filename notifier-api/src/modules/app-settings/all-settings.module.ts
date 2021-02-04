import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { AllSettings } from './all-settings.entity';
import { AllSettingsService } from './all-settings.service';
import { AllSettingsController } from './all-settings.controller';

@Module({
  imports: [
    TypeOrmModule.forFeature([AllSettings])
  ],
  providers: [AllSettingsService],
  controllers: [AllSettingsController],
  exports: [AllSettingsService]
})
export class AllSettingsModule {}