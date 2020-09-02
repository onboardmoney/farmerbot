import { Injectable } from '@nestjs/common';
import { App } from '@onboardmoney/sdk';
import { Cron } from '@nestjs/schedule';
import Axios, { AxiosInstance } from "axios";

import { Tweet } from './types';
import { DatabaseService } from './database/database.service';
import { CommandService } from './command.service';

@Injectable()
export class BotService {
  app: App;
  axios: AxiosInstance;
  name: string

  constructor(private readonly db: DatabaseService,
    private readonly commandService: CommandService) {
    this.name = process.env.BOT_NAME ? process.env.BOT_NAME : "testtestx"
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
    // this.axios.interceptors.request.use(request => {
    //   console.log('Starting Request', request)
    //   return request
    // })
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

  // this function will run every minute at second 0
  @Cron("*/15 * * * * *")
  async pullTweets() {
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

    if (data.data === undefined) return;

    // parse them
    const tweets = data.data.map(({ id, text, author_id, entities }) => {
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
    console.log('parsed tweets:', tweets.length)

    // store them in redis
    this.db.addTweets(tweets)
  }
}
