import { Injectable, Logger } from '@nestjs/common';
import Axios, { AxiosInstance } from "axios";
import Twitter from "twit";

import { Tweet } from './types';
import { DatabaseService } from './database/database.service';

@Injectable()
export class TwitterService {
  axios: AxiosInstance;
  twit: Twitter

  constructor(private readonly db: DatabaseService) {
    this.axios = Axios.create({
      baseURL: "https://api.twitter.com",
      headers: {
        "Authorization": "Bearer ".concat(process.env.TWITTER_V2_BEARER_TOKEN)
      }
    })
    if (this.hasCredentials()) {
      this.twit = Twitter({
        consumer_key: process.env.TWITTER_API_KEY,
        consumer_secret: process.env.TWITTER_API_KEY_SECRET,
        access_token: process.env.BOT_ACCESS_TOKEN,
        access_token_secret: process.env.BOT_ACCESS_TOKEN_SECRET
      })
    }
  }

  hasCredentials() {
    const token = process.env.BOT_ACCESS_TOKEN
    const secret = process.env.BOT_ACCESS_TOKEN_SECRET
    return token != undefined && token.length > 0 && secret != undefined && secret.length > 0
  }

  setCredentials(token: string, tokenSecret: string) {
    // ugly
    process.env.BOT_ACCESS_TOKEN = token
    process.env.BOT_ACCESS_TOKEN_SECRET = tokenSecret

    // create twitter instance with fresh access token
    this.twit = Twitter({
      consumer_key: process.env.TWITTER_API_KEY,
      consumer_secret: process.env.TWITTER_API_KEY_SECRET,
      access_token: token,
      access_token_secret: tokenSecret
    })
  }

  public async getMentions(username: string, sinceTweet?: string): Promise<Tweet[]> {
    Logger.debug(`Fetching tweets since tweet: ${sinceTweet}`)

    // craft api call params
    const params = {
      query: "@" + username,
      expansions: "entities.mentions.username,author_id",
    }

    if (sinceTweet !== null) {
      params['since_id'] = sinceTweet
    }

    // pull tweets which mention the bot
    // console.log(this.axios, params)
    const { data } = await this.axios.get('/2/tweets/search/recent', { params })
    const tweets = data.data

    if (tweets === undefined) return [];

    Logger.debug(`Got ${tweets.length} tweets`)

    // get users from every included user entity
    const users = data.includes.users.reduce((obj, item) => {
      return {
        ...obj,
        [item.id]: item.username
      }
    }, {})

    // set the tweet's author's name 
    return tweets.map((t) => {
      if (users[t.author_id] !== undefined) {
        t.author_name = users[t.author_id]
      }
      return t
    })
  }

  public async reply(tweet: Tweet | string, message: string): Promise<any> {
    const tweetId = typeof (tweet) === 'string' ? tweet : tweet.id
    const params = {
      status: message,
      in_reply_to_status_id: tweetId,

    }
    return new Promise((resolve, reject) => {
      this.twit.post(
        'statuses/update',
        params,
        (err, resp) => {
          if (err) {
            Logger.error(err)
            reject(err)
          }
          resolve(resp)
        }
      )

    })
  }

  public async sendDM(recepient: string, message: string): Promise<any> {
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
    this.twit.post(
      'direct_messages/events/new',
      params,
      (resp, err) => {
        if (err) Logger.error(err)
      }
    )
  }
}
