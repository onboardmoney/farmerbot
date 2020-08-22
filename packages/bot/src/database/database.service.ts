import { Injectable, OnModuleInit } from '@nestjs/common';
import { RedisService } from 'nestjs-redis';
import { Redis } from 'ioredis';

@Injectable()
export class DatabaseService implements OnModuleInit {
  client: Redis;

  constructor(private readonly redisService: RedisService) {
  }
  async onModuleInit() {
      this.client = await this.getClient()
  }

  private getUserKey(userId: string): string {
    return 'user:' + userId
  }

  async getClient() {
    return this.redisService.getClient()
  }

  // TODO : define entity
  async createUser(userId: string, address: string): Promise<any> {

    const user = {
      userId,
      address
    }

    const key = this.getUserKey(userId)
    await this.client.set(key, JSON.stringify(user))
    return user
  }

  async getUser(userId: string): Promise<any> {
    const key = this.getUserKey(userId)
    const user = await this.client.get(key);
    return JSON.parse(user)
  }

  async createEvent(): Promise<any> {

  }

}
