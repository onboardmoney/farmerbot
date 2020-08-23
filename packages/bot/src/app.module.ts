import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { BotService } from './bot.service';
import { DatabaseModule } from './database/database.module';
import { CommandService } from './command.service';

@Module({
  imports: [DatabaseModule],
  controllers: [AppController],
  providers: [BotService, CommandService],
})
export class AppModule { }
