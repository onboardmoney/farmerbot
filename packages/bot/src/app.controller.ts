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

  // createSignature(httpMethod: string, url: string, parameters: any): string {
  //   const keys = Object.keys(parameters).sort()
  //   const paramsStr = keys.map((key: string) => {
  //     return `${key}=${encodeURIComponent(parameters[key])}`
  //   }).join('&')
  //   // const paramsStr = Object.entries(parameters).map(([key, value]: [string, string]) => {
  //   //   return `${key}="${encodeURIComponent(value)}"`
  //   // }).join('&')
  //   const sigBaseStr = `${httpMethod.toUpperCase()}&${encodeURIComponent(url)}&${encodeURIComponent(paramsStr)}`
  //   const signingKey = encodeURIComponent(this.apiKeySecret) + "&"
  //   console.log(url, paramsStr, sigBaseStr)
  //   return createHmac('sha1', signingKey).update(sigBaseStr).digest('base64');
  // };

  // getOAuthParams(method: Method, url: string, params: any) {
  //   const nonce = randomBytes(32).toString('base64').replace(/[^0-9a-zA-Z]/g, '');
  //   const timestamp = Math.round(Date.now() / 1000);
  //   const oauthParams = {
  //     "oauth_consumer_key": this.apiKey,
  //     "oauth_nonce": nonce,
  //     "oauth_signature_method": "HMAC-SHA1",
  //     "oauth_timestamp": timestamp.toString(),
  //     "oauth_version": "1.0A"
  //   }
  //   if (params) {
  //     const keys = Object.keys(params).sort()
  //     keys.forEach((key: string) => {
  //       oauthParams[key] = params[key]
  //     })
  //     const signature = this.createSignature(
  //       'post',
  //       'https://api.twitter.com/oauth/request_token',
  //       oauthParams
  //     )
  //     oauthParams['oauth_signature'] = signature
  //   }
  //   return oauthParams
  // }

  // getAuthHeader(params) {
  //   const keys = Object.keys(params).sort()
  //   const encodedParams = keys.map((key: string) => {
  //     return `${key}="${encodeURIComponent(params[key])}"`
  //   })
  //   console.log(encodedParams)
  //   return "OAuth " + encodedParams.join(', ')
  // }

  // async makeSecureRequest(method: Method, url: string, params: any): Promise<any> {
  //   let oauthParams = this.getOAuthParams(method, url, params)
  //   oauthParams["oauth_callback"] = encodeURIComponent(this.callbackUrl)
  //   const headers = {
  //     'Authorization': this.getAuthHeader(oauthParams),
  //     'Content-Type': 'application/x-www-form-urlencoded'
  //   }

  //   let body = {
  //     "oauth_consumer_key": this.apiKey,
  //     "oauth_callback": encodeURIComponent(this.callbackUrl),
  //   }
  //   // for (const [k, v] of Object.entries(data)) {
  //   //   data[k] = encodeURIComponent(v)
  //   // }
  //   const data = stringify(body)
  //   // .replace(/\!/g, "%21")
  //   // .replace(/\'/g, "%27")
  //   // .replace(/\(/g, "%28")
  //   // .replace(/\)/g, "%29")
  //   // .replace(/\*/g, "%2A");

  //   headers['Content-length'] = data.length

  //   console.log('headers', headers)
  //   console.log('data', data)
  //   return this.axios.request({
  //     method,
  //     url,
  //     data,
  //     headers
  //   })
  // }

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
    const {oauth_token, oauth_verifier } = req.query
    console.log(this.accessToken, this.accessTokenSecret, oauth_verifier)
    this.oauth.getOAuthAccessToken(this.accessToken, this.accessTokenSecret, oauth_verifier, (err, token, secret) => {
      console.log(token, secret)
      this.botService.setCredentials(token, secret)
    })
  }
}
