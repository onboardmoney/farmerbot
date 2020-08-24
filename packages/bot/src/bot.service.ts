import { Injectable } from '@nestjs/common';
import { App } from '@onboardmoney/sdk';
import { Cron } from '@nestjs/schedule';

import { User, Tweet } from './types';
import { DatabaseService } from './database/database.service';
import { CommandService } from './command.service';

@Injectable()
export class BotService {
  app: App;
  constructor(private readonly db: DatabaseService,
    private readonly commandService: CommandService) {
    this.app = new App(
      "99f80e1e8d41119b75018855031b8f36c65c7fc6c00603d8475e778a2b969e98",
      "https://goerli.onboard.money"
    );
  }

  async processTweet(tweet: Tweet): Promise<void> {
    const words = tweet.text.split(' ')
    // words[0] should be the @ mention
    // words[1] command
    // words[2:] args
    console.log(words)
    let user = await this.db.getUser(tweet.author_id)

    if (!user) {
      const {userAddress} = await this.app.createUser();
      user = await this.db.createUser(tweet.author_id, userAddress)
    }
    console.log('User', user)
    const [mention, command, ...args] = words;

    await this.commandService.processCommand(user, command, args)
  }


  // this function will run every minute at second 30
  @Cron("30 * * * * *")
  async process(): Promise<void> {
    // get parsed tweets from redis
    const tweets = []
    await Promise.all(tweets.map(tweet => this.processTweet(tweet)))
  }

  // this function will run every minute at second 0
  @Cron("0 * * * * *")
  async pullTweets() {
    // pull tweets from twitter
    // parse them
    // store them in redis
  }
}
