import { Controller, Get, Req, Post } from '@nestjs/common';
import { AppService } from './app.service';
import { Request } from 'express';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get("/ping")
  ping(): string {
    return "pong"
  }

  @Post("/process")
  processMentions(@Req() req: Request): any {
    const tweets = req.body
    this.appService.process(tweets)
  }
}
