import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
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