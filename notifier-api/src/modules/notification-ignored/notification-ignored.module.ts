import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { NotificationIgnoredController } from './notification-ignored.controller';

import { NotificationIgnoredItem } from './notification-ignored.entity';
import { NotificationIgnoredService } from './notification-ignored.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([NotificationIgnoredItem])
  ],
  providers: [NotificationIgnoredService],
  controllers: [NotificationIgnoredController],
  exports: [ NotificationIgnoredService ]
})
export class NotificationModule {}