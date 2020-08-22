import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { BotService } from './bot.service';
import { DatabaseModule } from './database/database.module';

@Module({
  imports: [DatabaseModule],
  controllers: [AppController],
  providers: [BotService],
})
export class AppModule { }
