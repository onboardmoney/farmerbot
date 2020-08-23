import { Module, Global } from '@nestjs/common';
import { RedisModule } from 'nestjs-redis'
import { DatabaseService } from './database.service';

@Global()
@Module({
  imports: [RedisModule.register({
    url: 'redis://localhost:6379',
  })],
  providers: [DatabaseService],
})
export class DatabaseModule { }
