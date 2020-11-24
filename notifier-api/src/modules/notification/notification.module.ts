import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { NotificationController } from './notification.controller';

import { NotificationIgnoredItem } from './notification-ignored.entity';
import { NotificationRecord } from './notification.entity';
import { NotificationService } from './notification.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([NotificationRecord, NotificationIgnoredItem])
  ],
  providers: [NotificationService],
  controllers: [NotificationController],
  exports: [ NotificationService ]
})
export class NotificationModule {}