import { Injectable } from '@nestjs/common';
import { DatabaseService } from './database/database.service';
import axios, { AxiosInstance } from "axios";
import { Cron } from '@nestjs/schedule';

@Injectable()
export class SubGraphService {

  axiosInstance: AxiosInstance;

  constructor(private readonly db: DatabaseService) {
    const url = "https://api.thegraph.com"
    this.axiosInstance = axios.create({
      baseURL: url
    });
  }

  @Cron("*/15 * * * * *")
  async getTransfers() {
    const query = {
      "query": "{tokens(first: 5) { id decimals name symbol } transfers(first: 5) { id from to value }}"
    }
    console.log('pulling transfers')
    const ret = await this.axiosInstance.post(
      '/subgraphs/name/itirabasso/farmerbot',
      query
    )
    // console.log('response:', ret)
  }
}
