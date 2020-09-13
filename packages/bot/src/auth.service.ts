import { Injectable, Logger, Inject } from '@nestjs/common';
import { OAuth } from "oauth"

@Injectable()
export class AuthService {
  requestSecrets: { [token: string]: string}
  callbackUrl: string;
  oauth: OAuth;

  constructor() {

    this.oauth = new OAuth(
      'https://api.twitter.com/oauth/request_token',
      'https://api.twitter.com/oauth/access_token',
      process.env.TWITTER_API_KEY,
      process.env.TWITTER_API_KEY_SECRET,
      '1.0A',
      process.env.TWITTER_AUTH_CALLBACK,
      'HMAC-SHA1'
    );


  }

  async getRequestToken(): Promise<string> {
    return new Promise((resolve, reject) => {
      this.oauth.getOAuthRequestToken(async (err, token, secret, results) => {
        // TODO : check the content of results
        if (err) reject(err)
        this.requestSecrets[token] = secret;
        resolve(`https://api.twitter.com/oauth/authorize?oauth_token=${token}`)
      })
    })
  }

  async getAccessToken(token, verifier): Promise<string[]> {
    const secret = this.requestSecrets[token]
    if (secret === undefined) throw Error();
    return new Promise((resolve, reject) => {
      this.oauth.getOAuthAccessToken(token, secret, verifier, (err, token, secret) => {
        if (err) reject(err);
        resolve([token, secret])
      })
    })
  }

}
