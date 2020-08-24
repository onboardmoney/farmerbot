import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';

import { AppController } from './app.controller';
import { BotService } from './bot.service';
import { DatabaseModule } from './database/database.module';
import { CommandService } from './command.service';
import { DatabaseService } from './database/database.service';
@Module({
  imports: [DatabaseModule, ScheduleModule.forRoot()],
  controllers: [AppController],
  providers: [BotService, DatabaseService, CommandService],
})
export class AppModule { }
