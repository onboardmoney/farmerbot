import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';

import { AppController } from './app.controller';
import { AuthService } from './auth.service';
import { BotService } from './bot.service';
import { DatabaseModule } from './database/database.module';
import { CommandService } from './command.service';
import { DatabaseService } from './database/database.service';
import { SubGraphService } from './subgraph.service';

import { App } from '@onboardmoney/sdk';

@Module({
  imports: [
    DatabaseModule,
    ScheduleModule.forRoot()
  ],
  controllers: [AppController],
  providers: [AuthService, BotService, DatabaseService, CommandService, SubGraphService, {
    provide: 'ONBOARD_MONEY',
    useValue: new App(process.env.OM_API_KEY, `https://${process.env.NETWORK}.onboard.money`)
  }],
})
export class AppModule { }
