import { Injectable } from '@nestjs/common';
import { DatabaseService } from './database/database.service';
import axios, { AxiosInstance } from "axios";
import { Cron } from '@nestjs/schedule';
import { CommandService } from './command.service';

@Injectable()
export class SubGraphService {

  axiosInstance: AxiosInstance;

  constructor(
    private readonly db: DatabaseService,
    private readonly cmdService: CommandService
  ) {
    const url = "https://api.thegraph.com"
    this.axiosInstance = axios.create({
      baseURL: url
    });
  }

  @Cron("*/15 * * * * *")
  async getTransfers() {
    const query = {
      "query": `{
        transfers {
          id
          from
          to
          value
        }
      }`
    }
    console.log('pulling transfers')
    const ret = await this.axiosInstance.post(
      '/subgraphs/name/itirabasso/kovangraph',
      query
    )
    const { data } = ret;
    if (data === undefined) return;
    const { transfers } = data.data;
    console.log(transfers)
    const pending = await this.db.getPendingTransfers()
    console.log(pending)
    for (const transfer of transfers) {
      if (pending.includes(transfer.to)) {
        console.log('transfer from', transfer)
        await this.cmdService.doPlant(transfer.to)
      }
    }
  }
}
