import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { AppInfoModule } from '../app-info/app-info.module';
import { NotificationController } from './notification.controller';
import { NotificationRecord } from './notification.entity';
import { NotificationService } from './notification.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([NotificationRecord])
  ],
  providers: [NotificationService],
  controllers: [NotificationController],
  exports: [ NotificationService ]
})
export class NotificationModule {}