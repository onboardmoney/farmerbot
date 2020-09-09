import { Injectable, Logger } from '@nestjs/common';
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

    Logger.debug(`Pulling transfers`)
    const ret = await this.axiosInstance.post(
      '/subgraphs/name/itirabasso/kovangraph',
      query
    )
    const { data } = ret;
    if (data === undefined) return;
    const { transfers } = data.data;

    // map all addresses to upper case
    const pending = (await this.db.getPendingTransfers()).map(s => s.toUpperCase())

    for (const transfer of transfers) {
      if (pending.includes(transfer.to.toUpperCase())) {
        console.log('got transfer from', transfer)
        await this.cmdService.doPlant(transfer.to)
      }
    }
  }
}
