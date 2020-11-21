import { Module, Global } from '@nestjs/common';

import { HelperService } from './helper.service';

@Global()
@Module({
  controllers: [],
  providers: [HelperService],
  exports: [HelperService],
})
export class SharedModule {}