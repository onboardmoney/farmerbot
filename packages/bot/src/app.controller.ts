import { Controller, Get, Req, Res } from '@nestjs/common';
import { BotService } from './bot.service';
import { Request, Response } from 'express';
import { AuthService } from './auth.service';

@Controller()
export class AppController {
  constructor(
    private readonly botService: BotService,
    private readonly authService: AuthService) {
  }

  @Get("/ping")
  ping(): string {
    return "pong"
  }

  @Get('/auth')
  async auth(@Req() req: Request, @Res() res: Response) {
    const url = await this.authService.getRequestToken()
    res.redirect(url)
  }

  @Get("/callback")
  async callback(@Req() req: Request): Promise<any> {
    const { oauth_token, oauth_verifier } = req.query
    const [token, secret] = await this.authService.getAccessToken(oauth_token, oauth_verifier)
    this.botService.setCredentials(token, secret)
    return [token, secret]
  }
}
