import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

// process.env.TZ = 'utc';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, { cors: true });
  await app.listen(3000);
}
bootstrap();
