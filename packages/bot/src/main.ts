require('dotenv').config()

import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { readFileSync } from 'fs';

declare const module: any


async function bootstrap() {
 
  const keyFile = readFileSync(process.env.PRIVATE_KEY_SSL_FILEPATH || 'ssl/localhost.key.pem')
  const certFile = readFileSync(process.env.CERTIFICATE_SSL_FILEPATH || 'ssl/localhost.crt.pem')

  const app = await NestFactory.create(AppModule, {
    httpsOptions: {
      key: keyFile,
      cert: certFile,
    },
    logger: ['error', 'warn', 'debug'],
  });
  await app.listen(process.env.PORT);

  if (module.hot) {
    module.hot.accept()
    module.hot.dispose(() => app.close())
  }
}
bootstrap();
