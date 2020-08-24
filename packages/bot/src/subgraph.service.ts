import { Injectable } from '@nestjs/common';
import WebSocket from "ws";
import { DatabaseService } from './database/database.service';

@Injectable()
export class SubGraphService {
  ws: WebSocket;
  constructor(private readonly db: DatabaseService) {
    this.ws = new WebSocket("wss://api.thegraph.com/subgraphs/name/itirabasso/farmerbot");
    this.ws.on('message', (msg) => {
      console.log(msg)
    })
  }
}
