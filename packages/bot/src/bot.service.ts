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
    this.name = "testtest"
    this.app = new App(
      process.env.APPLICATION_API_KEY,
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
    console.log(words)
    let user = await this.db.getUser(tweet.author)

    if (!user) {
      console.log('creating user', user)
      const { userAddress } = await this.app.createUser();
      console.log('got addr', userAddress)
      user = await this.db.createUser(tweet.author, userAddress)
    }
    console.log('User', user)
    const [mention, command, ...args] = words;

    await this.commandService.processCommand(user, command, args)
    await this.db.removeTweet(tweet.id)
  }

  // this function will run every minute at second 30
  @Cron("*/15 * * * * *")
  async process(): Promise<void> {
    // get parsed tweets from redis
    const tweets = await this.db.getTweets()
    console.log('tweets to process', tweets.length)
    if (tweets.length === 0) return;

    // do we care about order execution?
    await Promise.all(tweets.map(tweet => this.processTweet(tweet)))
  }

  // this function will run every minute at second 0
  @Cron("*/15 * * * * *")
  async pullTweets() {
    console.log('pulling tweets')
    // pull tweets from twitter

    const lastTweetId = await this.db.getLastTweetId();
    const { data } = await this.axios.get('/2/tweets/search/recent', {
      params: {
        query: "@" + this.name,
        expansions: "entities.mentions.username,author_id",
        since_id: lastTweetId
      },
    })

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
    console.log('tweets', tweets)

    // store them in redis
    this.db.addTweets(tweets)
  }
}
