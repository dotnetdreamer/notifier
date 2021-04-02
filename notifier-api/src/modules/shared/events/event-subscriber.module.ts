import { Module } from '@nestjs/common';

import { SyncItemModule } from 'src/modules/sync/sync-item.module';
import { EventSubScriberService } from './event-subscriber.service';

@Module({
  imports: [
    SyncItemModule
  ],
  providers: [EventSubScriberService],
  controllers: [],
  exports: [ EventSubScriberService ]
})
export class EventSubscriberModule {}