import { Controller, Get, Req, Res, Post } from '@nestjs/common';
import { BotService } from './bot.service';
import { Request, response, Response } from 'express';
import Axios, { AxiosInstance } from "axios";
import { createHmac, randomBytes } from 'crypto';
import { stringify } from 'querystring';
import { Method } from 'axios';
import { OAuth } from "oauth"

@Controller()
export class AppController {
  axios: AxiosInstance;
  apiKey: string;
  apiKeySecret: string;
  accessToken: string;
  accessTokenSecret: string;
  callbackUrl: string;
  oauth: OAuth;

  constructor(private readonly botService: BotService) {
    this.axios = Axios.create({
      baseURL: "https://api.twitter.com",
    })
    this.apiKey = "KOwO5eNm2wKM59Izw68MlOssS"
    this.apiKeySecret = "mMHbWxXUZqrMgcFBjFiRBgX8jQLB15bAJbUynV67LIAouaUpBD"
    this.accessToken = ""
    this.accessTokenSecret = ""
    this.callbackUrl = "https://d3154ff541b7.ngrok.io/callback"
    this.oauth = new OAuth(
      'https://api.twitter.com/oauth/request_token',
      'https://api.twitter.com/oauth/access_token',
      this.apiKey,
      this.apiKeySecret,
      '1.0A',
      this.callbackUrl,
      'HMAC-SHA1'
    );
  }

  @Get("/ping")
  ping(): string {
    return "pong"
  }

  @Get('/auth')
  async auth(@Req() req: Request, @Res() res: Response) {
    const params = {}

    this.oauth.getOAuthRequestToken(async (err, token, secret, results) => {
      this.accessToken = token
      this.accessTokenSecret = secret
      res.redirect(`https://api.twitter.com/oauth/authorize?oauth_token=${token}`)
    })
  }

  @Get("/callback")
  callback(@Req() req: Request): any {
    const { oauth_token, oauth_verifier } = req.query
    this.oauth.getOAuthAccessToken(this.accessToken, this.accessTokenSecret, oauth_verifier, (err, token, secret) => {
      this.botService.setCredentials(token, secret)
    })
  }
}
