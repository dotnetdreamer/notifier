import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';

import { TypeOrmModule } from '@nestjs/typeorm';
import { WinstonModule } from 'nest-winston';

import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AppSettings } from './modules/app-settings/app-settings.entity';
import { AppSettingsModule } from './modules/app-settings/app-settings.module';
import { AppInfo } from './modules/app-info/app-info.entity';
import { AppInfoModule } from './modules/app-info/app-info.module';
import { NotificationIgnoredItem } from './modules/notification-ignored/notification-ignored.entity';
import { NotificationIgnoredModule } from './modules/notification-ignored/notification-ignored.module';
import { NotificationRecord } from './modules/notification/notification.entity';
import { NotificationModule } from './modules/notification/notification.module';
import { FrontendMiddleware } from './modules/shared/front-end.middleware';
import { SharedModule } from './modules/shared/shared.module';

const CONNECTION_NAME = "default";

@Module({
  imports: [
    TypeOrmModule.forRoot({
      name: CONNECTION_NAME,
      type: 'sqlite',
      database: './_db/notifier.db',
      entities: [
        , AppSettings
        , NotificationRecord
        , NotificationIgnoredItem
        , AppInfo
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
    AppSettingsModule
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(FrontendMiddleware).forRoutes('/');
  }
}
