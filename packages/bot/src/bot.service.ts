import { Injectable } from '@nestjs/common';
import { App } from '@onboardmoney/sdk';
import { RedisService } from 'nestjs-redis';

import { User, Tweet } from './types';
import { 
  GIVE_COMMAND,
  HARVEST_COMMAND,
  PLANT_COMMAND,
  POLINATE_COMMAND,
  UNROOT_COMMAND,
  give,
  harvest,
  plant,
  polinate,
  unroot
} from "./commands"
import { DatabaseService } from './database/database.service';

@Injectable()
export class BotService {
  app: App;
  constructor(private readonly db: DatabaseService) {
    this.app = new App(
      "99f80e1e8d41119b75018855031b8f36c65c7fc6c00603d8475e778a2b969e98",
      "https://goerli.onboard.money"
    );
  }

  async processCommand(user: User, command: string, args: any[]): Promise<void> {
    switch (command) {
      case PLANT_COMMAND:
        return plant(user)
      case HARVEST_COMMAND:
        return harvest(user, args)
      case POLINATE_COMMAND:
        return polinate(user)
      case UNROOT_COMMAND:
        return unroot(user, args)
      case GIVE_COMMAND:
        return give(user, args)
    }
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

    await this.processCommand(user, command, args)
  }

  async process(tweets: any[]): Promise<void> {
    // console.log(tweets)
    await Promise.all(tweets.map(tweet => this.processTweet(tweet)))
  }
}
