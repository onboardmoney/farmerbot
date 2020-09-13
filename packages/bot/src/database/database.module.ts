import { Module } from '@nestjs/common';
import { RedisModule } from 'nestjs-redis'
import { DatabaseService } from './database.service';

@Module({
  imports: [RedisModule.register({
    url: 'redis://farmerbot.redis:6379',
  })],
  providers: [DatabaseService],
})
export class DatabaseModule { }
