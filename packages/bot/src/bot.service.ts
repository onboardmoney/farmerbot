import { Injectable, Logger, Inject } from '@nestjs/common';
import { App } from '@onboardmoney/sdk';
import { Cron } from '@nestjs/schedule';

import { Tweet } from './types';
import { DatabaseService } from './database/database.service';
import { CommandService } from './command.service';
import { TwitterService } from './twitter.service';

@Injectable()
export class BotService {
  name: string

  constructor(private readonly db: DatabaseService,
    private readonly commandService: CommandService,
    private readonly twitter: TwitterService,
    @Inject("ONBOARD_MONEY") private readonly onboardmoney: App) {

    this.name = process.env.BOT_NAME
  }

  // TODO : make this configurable
  @Cron(process.env.CRON_TIME)
  async pullTweets() {
    // get tweets
    const tweets = await this.getTweets();

    // parse them
    const parsedTweets = tweets.map(({ id, text, author_id, author_name, entities }) => {
      return {
        id,
        text,
        author_name,
        author: author_id,
      }
    })

    Logger.debug(`Parsed tweets: ${parsedTweets.length}`)

    // store them in redis
    await this.db.addTweets(parsedTweets)
    // const ids = parsedTweets.map(t => t.id)

  }

  // TODO : make this configurable
  @Cron(process.env.CRON_TIME)
  async process(): Promise<void> {

    if (!this.twitter.hasCredentials()) {
      Logger.warn(`You can't process tweets without credentials!`)
      return;
    }

    // get parsed tweets from redis
    const tweets = await this.db.getTweets()
    Logger.debug(`tweets to process: ${tweets.length}`)

    if (tweets.length === 0) return;

    for (const tweet of tweets) {
      await this.processTweet(tweet)
      await this.db.removeTweet(tweet.id)
    }
  }

  private async getTweets(): Promise<any[]> {
    const lastTweetId = await this.db.getLastTweetId();
    return this.twitter.getMentions(this.name, lastTweetId)
  }

  async processTweet(tweet: Tweet): Promise<void> {
    const words = tweet.text.split(' ')

    // This only supports tweets like "@botname command arg1 arg2 ..."
    // And DO NOT support tweets like  "(n words) @botname command args"
    const [mention, command, ...args] = words;

    let user = await this.db.getUser(tweet.author)

    // process the command
    Logger.debug('about to process')
    await this.commandService.processCommand(user, tweet, command, args)
  }

}
