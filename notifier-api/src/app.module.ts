import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';

import { TypeOrmModule } from '@nestjs/typeorm';
import { WinstonModule } from 'nest-winston';
import { EventEmitterModule } from '@nestjs/event-emitter';

import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AllSettings } from './modules/app-settings/all-settings.entity';
import { AllSettingsModule } from './modules/app-settings/all-settings.module';
import { AppInfo } from './modules/app-info/app-info.entity';
import { AppInfoModule } from './modules/app-info/app-info.module';
import { NotificationIgnoredItem } from './modules/notification-ignored/notification-ignored.entity';
import { NotificationIgnoredModule } from './modules/notification-ignored/notification-ignored.module';
import { NotificationRecord } from './modules/notification/notification.entity';
import { NotificationModule } from './modules/notification/notification.module';
import { FrontendMiddleware } from './modules/shared/front-end.middleware';
import { SharedModule } from './modules/shared/shared.module';
import { SyncItem } from './modules/sync/sync-item.entity';
import { SyncItemModule } from './modules/sync/sync-item.module';
import { EventSubscriberModule } from './modules/shared/events/event-subscriber.module';

const CONNECTION_NAME = "default";

@Module({
  imports: [
    EventEmitterModule.forRoot(),
    TypeOrmModule.forRoot({
      name: CONNECTION_NAME,
      type: 'sqlite',
      database: './_db/notifier.db',
      entities: [
        , AllSettings
        , NotificationRecord
        , NotificationIgnoredItem
        , AppInfo
        , SyncItem
      ],
      synchronize: true,
    }),
    WinstonModule.forRoot({
      // options
    }),
    SharedModule,
    AppInfoModule,
    NotificationModule,
    NotificationIgnoredModule,
    AllSettingsModule,
    SyncItemModule,
    EventSubscriberModule
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(FrontendMiddleware).forRoutes('/');
  }
}
