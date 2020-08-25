import { Injectable } from '@nestjs/common';
import WebSocket, { OpenEvent } from "ws";
// import { OpenEvent } from "@types/ws";
import { DatabaseService } from './database/database.service';

@Injectable()
export class SubGraphService {
  ws: WebSocket;
  constructor(private readonly db: DatabaseService) {
    this.ws = new WebSocket(
      "wss://api.thegraph.com/subgraphs/name/itirabasso/farmerbot",
      { path:"/query" }
    );
    console.log('creating ws')
    this.ws.on('open', (event: OpenEvent) => {
        console.log('open', event)
      }
    )
    this.ws.on('upgrade', (req: any) => {
      console.log('upgrade', req)
    })
    this.ws.on('close', (code: number, reason: string) => {
      console.log('close', code, reason)
    })
    this.ws.on('error', (err: any) => {
      console.log('error', err)
    })
    // this.ws.on('message', (msg) => {
    //   console.log('msg', msg)
    //   console.log('aaaaaaaa')
    //   const query = {
    //     "query": "{tokens(first: 5) { id decimals name symbol } transfers(first: 5) { id from to value }}"
    //   }
    //   this.ws.send(query)
    // })
  }
}
