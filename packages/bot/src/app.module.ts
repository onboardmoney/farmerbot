import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { GraphQLModule } from '@nestjs/graphql';

import { AppController } from './app.controller';
import { BotService } from './bot.service';
import { DatabaseModule } from './database/database.module';
import { CommandService } from './command.service';
import { DatabaseService } from './database/database.service';
import { SubGraphService } from './subgraph.service';

@Module({
  imports: [
    DatabaseModule,
    ScheduleModule.forRoot()
  ],
  controllers: [AppController],
  providers: [BotService, DatabaseService, CommandService, SubGraphService],
})
export class AppModule { }
