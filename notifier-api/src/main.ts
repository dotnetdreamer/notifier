import { NestFactory } from '@nestjs/core';
import * as bodyParser from 'body-parser';

import { AppModule } from './app.module';

// process.env.TZ = 'utc';

// async function bootstrap() {
//   const app = await NestFactory.create(AppModule, { cors: true });
//   await app.listen(3000);
// }

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  // app.useStaticAssets(`${__dirname}/public`);
  // the next two lines did the trick
  //fix: PayloadTooLargeError: request entity too large
  //from: https://stackoverflow.com/a/52785747/859968
  app.use(bodyParser.json({ limit: '50mb' }));
  app.use(bodyParser.urlencoded({ limit: '50mb', extended: true }));
  app.enableCors();
  await app.listen(3000);
}
bootstrap();
