import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { SyncItem } from './sync-item.entity';
import { SyncItemService } from './sync-item.service';
import { SyncItemController } from './sync-item.controller';

@Module({
  imports: [
    TypeOrmModule.forFeature([SyncItem])
  ],
  providers: [SyncItemService],
  controllers: [SyncItemController],
  exports: [ SyncItemService, TypeOrmModule.forFeature([SyncItem])]
})
export class SyncItemModule {}