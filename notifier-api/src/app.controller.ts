import { Controller, Get } from '@nestjs/common';

import { AppService } from './app.service';
import { AppConstant } from './modules/shared/app-constant';

@Controller(`${AppConstant.ROUTE_PREFIX}/app`)
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get('getInfo')
  getInfo(): string {
    return "Up and running";
  }
}
