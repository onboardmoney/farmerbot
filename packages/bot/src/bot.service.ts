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
    this.name = "farmerbot"
    this.app = new App(
      process.env.APPLICATION_API_KEY,
      "https://goerli.onboard.money"
    );
    this.axios = Axios.create({
      baseURL: "https://api.twitter.com/2",
      headers: {
        "Authorization": "Bearer ".concat(process.env.TWITTER_ACCESS_TOKEN)
      }
    })
  }

  async processTweet(tweet: Tweet): Promise<void> {
    const words = tweet.text.split(' ')
    // words[0] should be the @ mention
    // words[1] command
    // words[2:] args
    console.log(words)
    let user = await this.db.getUser(tweet.author)

    if (!user) {
      const { userAddress } = await this.app.createUser();
      user = await this.db.createUser(tweet.author, userAddress)
    }
    console.log('User', user)
    const [mention, command, ...args] = words;

    await this.commandService.processCommand(user, command, args)
  }

  // this function will run every minute at second 30
  @Cron("*/15 * * * * *")
  async process(): Promise<void> {
    console.log('processing tweets')
    // get parsed tweets from redis
    const tweets = await this.db.getTweets()
    if (tweets.length === 0) return;
    console.log(tweets)
    await Promise.all(tweets.map(tweet => this.processTweet(tweet)))
  }

  // this function will run every minute at second 0
  @Cron("*/15 * * * * *")
  async pullTweets() {
    console.log('pulling tweets')
    // pull tweets from twitter
    const { data } = await this.axios.get('/tweets/search/recent', {
      params: {
        query: "@testtest",
        expansions: "entities.mentions.username,author_id"
      }
    })
    if (data.data === undefined) return;
    
    // parse them
    const tweets = data.data.map(({ id, text, mentions }) => {
      const author = mentions.filter(
        ({ username }) => username === this.name
      )
      return {
        id,
        text,
        author,
      }
    })
    console.log('tweets', tweets)

    // store them in redis
    this.db.addTweets(tweets)
  }
}
