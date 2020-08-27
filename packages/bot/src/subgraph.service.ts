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
        transfers(where: { to: "0x6B175474E89094C44Da98b954EedeAC495271d0F" } ) {
          id
          from
          to
          value
        }
      }`
    }
    console.log('pulling transfers')
    const ret = await this.axiosInstance.post(
      '/subgraphs/name/itirabasso/farmerbot',
      query
    )
    const { data } = ret;
    if (data === undefined) return;
    console.log(data)
    // const { transfers } = data;
    // for (const transfer of transfers) {
    //   await this.cmdService.doPlant(transfer.from)
    // }
    // console.log('response:', data)
  }
}
