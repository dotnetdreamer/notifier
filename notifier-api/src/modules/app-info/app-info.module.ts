import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AppInfoController } from './app-info.controller';

import { AppInfo } from './app-info.entity';
import { AppInfoService } from './app-info.service';


@Module({
  imports: [
    TypeOrmModule.forFeature([AppInfo])
  ],
  providers: [AppInfoService],
  controllers: [ AppInfoController ],
  exports: [ AppInfoService ]
})
export class AppInfoModule {}