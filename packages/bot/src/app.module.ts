import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { RedisModule} from 'nestjs-redis'

const options = {
  url: 'redis://localhost:6379',
}

@Module({
  imports: [RedisModule.register(options)],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule { }
