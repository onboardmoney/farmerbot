import { Injectable, Inject } from '@nestjs/common';
import { swapTokens, getSwapParams } from "uniswap-v2-helper"
import { RedisClient } from '@nestjs/microservices/external/redis.interface';
import { promisify } from 'util';
import { App } from '@onboardmoney/sdk';
import { RedisService } from 'nestjs-redis';

import { ethers, utils } from "ethers";
import { User, Tweet } from './types';
import { swap, deposit } from "./commands"

@Injectable()
export class AppService {
  app: App;
  constructor(private readonly redisService: RedisService) {
    this.app = new App(
      "99f80e1e8d41119b75018855031b8f36c65c7fc6c00603d8475e778a2b969e98",
      "https://goerli.onboard.money"
    );
  }

  async processCommand(user: User, command: string, args: any[]): Promise<void> {
    switch (command) {
      case "deposit":
        return deposit(user, args)
      case "swap":
        return swap(user, args)
    }
  }
      
  private getUserKey(userId: string): string {
    return 'user:' + userId
  }
  async getClient() {
    return this.redisService.getClient()
  }

  async createUser(userId: string): Promise<any> {

    const key = this.getUserKey(userId)
    const address = await this.app.createUser();
    const user = {
      userId,
      address
    }
    const redis = await this.getClient()
    await redis.set(key, JSON.stringify(user))
    console.log('user created')
    return user
  }

  async getUser(userId: string): Promise<any> {
    const key = this.getUserKey(userId)
    const redis = await this.getClient()

    return new Promise((resolve, reject) => {
      redis.get(key, (err, ret) => {
        if (err) return reject(err)
        return resolve(JSON.parse(ret))
      })
    })  
  }

  async processTweet(tweet: Tweet): Promise<void> {
    const words = tweet.text.split(' ')
    // words[0] should be the @ mention
    // words[1] command
    // words[2:] args
    console.log(words)
    let user = await this.getUser(tweet.author_id)
    if (!user) {
      user = await this.createUser(tweet.author_id)
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
