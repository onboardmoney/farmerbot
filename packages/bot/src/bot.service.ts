import { Injectable, OnModuleInit } from '@nestjs/common';
import { App } from '@onboardmoney/sdk';
import { Cron } from '@nestjs/schedule';
import Axios, { AxiosInstance } from "axios";
import Twitter from "twit";
import { OAuth } from "oauth"

import { Tweet } from './types';
import { DatabaseService } from './database/database.service';
import { CommandService } from './command.service';

@Injectable()
export class BotService implements OnModuleInit {
  app: App;
  axios: AxiosInstance;
  name: string
  twit: Twitter
  apiKey: string;
  apiKeySecret: string;
  accessToken: string;
  accessTokenSecret: string;
  callbackUrl: string;

  constructor(private readonly db: DatabaseService,
    private readonly commandService: CommandService) {
    this.name = process.env.BOT_NAME ? process.env.BOT_NAME : "testtestxx"
    this.app = new App(
      process.env.OM_API_KEY,
      `https://${process.env.NETWORK}.onboard.money`
    );
    this.axios = Axios.create({
      baseURL: "https://api.twitter.com",
      headers: {
        "Authorization": "Bearer ".concat(process.env.TWITTER_ACCESS_TOKEN)
      }
    })
    this.apiKey = "KOwO5eNm2wKM59Izw68MlOssS"
    this.apiKeySecret = "mMHbWxXUZqrMgcFBjFiRBgX8jQLB15bAJbUynV67LIAouaUpBD"
    this.accessToken = ""
    this.accessTokenSecret = ""
    this.callbackUrl = "https://d3154ff541b7.ngrok.io/callback"
    // this.twit = Twitter({
    // timeout_ms:           60*1000,  // optional HTTP request timeout to apply to all requests.
    // strictSSL:            true,     // optional - requires SSL certificates to be valid.
    // })
  }

  async onModuleInit() {
  //   const oauth = new OAuth(
  //     'https://api.twitter.com/oauth/request_token',
  //     'https://api.twitter.com/oauth/access_token',
  //     this.apiKey,
  //     this.apiKeySecret,
  //     '1.0',
  //     null,
  //     'HMAC-SHA1'
  //   );
  //   oauth.getOAuthRequestToken(async (err, token, secret, results) => {

  //     console.log(err, token, secret, results)
  //     const params = {
  //       oauth_token: token
  //     }
  //     const headers = {}
  //     const resp = await this.axios.get("https://api.twitter.com/oauth/authorize", { params, headers })
  //     console.log(resp)
  //     // oauth.getOAuthAccessToken(token, secret, verifier, (accessToken, accessTokenSecret) => {

  //     //   this.setCredentials(accessToken, accessTokenSecret)
  //     // })
  //   })
  }

  async setCredentials(token: string, tokenSecret: string) {
    console.log('setting credentials')
    this.twit = Twitter({
      consumer_key: this.apiKey,
      consumer_secret: this.apiKeySecret,
      access_token: token,
      access_token_secret: tokenSecret
    })
  }
  async processTweet(tweet: Tweet): Promise<void> {
    const words = tweet.text.split(' ')
    // words[0] should be the @ mention
    // words[1] command
    // words[2:] args
    // console.log(words)
    let user = await this.db.getUser(tweet.author)

    if (!user) {
      // console.log('creating user')
      const { userAddress } = await this.app.createUser();
      console.log('user created', userAddress)
      user = await this.db.createUser(tweet.author, userAddress)
      const message = "send your dai to " + userAddress
      await this.sendDM(tweet.author, message)
    }
    console.log('User', user)
    const [mention, command, ...args] = words;

    await this.commandService.processCommand(user, command, args)
  }

  // this function will run every minute at second 30
  @Cron("*/15 * * * * *")
  async process(): Promise<void> {
    // get parsed tweets from redis
    const tweets = await this.db.getTweets()
    console.log('tweets to process', tweets.length)
    if (tweets.length === 0) return;

    // do we care about order execution?
    // await Promise.all(tweets.map(tweet => this.processTweet(tweet)))
    for (const tweet of tweets) {
      await this.processTweet(tweet)
      await this.db.removeTweet(tweet.id)
    }
  }

  private async getTweets(): Promise<any[]> {
    const lastTweetId = await this.db.getLastTweetId();

    console.log('Fetching tweets since tweet', lastTweetId)

    // craft api call params
    const params = {
      query: "@" + this.name,
      expansions: "entities.mentions.username,author_id",
    }
    if (lastTweetId !== null) {
      params['since_id'] = lastTweetId
    }

    // pull tweets from twitter
    const { data } = await this.axios.get('/2/tweets/search/recent', { params })

    console.log('getTweets', data)
    if (data.data === undefined) return [];
    return data.data
  }

  // API key:KOwO5eNm2wKM59Izw68MlOssS
  // API key secret:mMHbWxXUZqrMgcFBjFiRBgX8jQLB15bAJbUynV67LIAouaUpBD
  // Access token:27136072-1D32Cq6h82rLy0lAudQvtwbbNOTSZwOfsARxwyuCI
  // Access token secret:t8GzWDoedLQrrKLSIriDT2ZHvMKxsvJLbpoXRxaeFA1Jm
  private async getAuthHeader(): Promise<string> {
    const nonce = Math.random().toString(36).substring(42)
    const timestamp = Date.now()
    const apiKey = "KOwO5eNm2wKM59Izw68MlOssS"
    const token = "27136072-1D32Cq6h82rLy0lAudQvtwbbNOTSZwOfsARxwyuCI"
    const values = {
      "oauth_consumer_key": apiKey,
      "oauth_nonce": nonce,
      "oauth_signature": "tnnArxj06cWHq44gCs1OSKk%2FjLY%3D",
      "oauth_timestamp": timestamp.toString(),
      "oauth_token": token,
      "oauth_signature_method": "HMAC-SHA1",
      "oauth_version": "1.0"
    }

    let parsedValues = Object.entries(values).map((key, value) => {
      return `${key}="${value}"`
    }).join(', ')
    return "OAuth" + parsedValues;
  }

  private async sendDM(recepient: string, message: string): Promise<any> {
    const params = {
      "event": {
        "type": "message_create",
        "message_create": {
          "target": {
            "recipient_id": recepient
          },
          "message_data": {
            "text": message
          }
        }
      }
    }
    // 'Authorization': await this.getAuthHeader()
    const headers = {
      'Content-Type': "application/json",

    }
    console.log('sending dm')
    // const pPost = promisify()
    // const response = await new Promise((resolve, reject) => {
    //   this.twit.post(
    //     'direct_messages/events/new',
    //     params,
    //     (resp, err) => {
    //       if (err) reject(err)
    //       resolve(resp)
    //     }
    //   )
    // })
    // const response = await this.axios.post('/1.1/direct_messages/events/new.json', { params, headers })
    this.twit.post(
      'direct_messages/events/new',
      params,
      (resp, err) => {
        console.log(resp, err)
      }
    )
  }

  // this function will run every minute at second 0
  @Cron("*/15 * * * * *")
  async pullTweets() {

    const tweets = await this.getTweets();

    // parse them
    const parsedTweets = tweets.map(({ id, text, author_id, entities }) => {
      const author = entities.mentions.filter(
        ({ username }) => username === this.name
      )
      // console.log('mention:', author)
      return {
        id,
        text,
        author: author_id
      }
    })
    console.log('parsed tweets:', parsedTweets.length)

    // store them in redis
    await this.db.addTweets(parsedTweets)
  }
}
