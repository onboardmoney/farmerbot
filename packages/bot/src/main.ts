import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { Transport } from "@nestjs/microservices";

require('dotenv').config()

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    logger: ['error', 'warn', 'debug'],
  });
  await app.listen(3000);
}
bootstrap();
