import { Injectable } from '@nestjs/common';
import { App } from '@onboardmoney/sdk';
import { ethers } from "ethers";

import addresses from "./contracts/addresses";
import abis from "./contracts/abis";
import { User, Tweet } from './types';

import { DatabaseService } from './database/database.service';

const PLANT_COMMAND = "plant";
const UNROOT_COMMAND = "unroot";
const HARVEST_COMMAND = "harvest";
const GIVE_COMMAND = "give";
const POLINATE_COMMAND = "polinate";

@Injectable()
export class CommandService {
  onboardmoney: App;

  constructor(private readonly db: DatabaseService) {
    // init onboard.money
    this.onboardmoney = new App(
      process.env.OM_APIKEY,
      `https://${process.env.NETWORK}.onboard.money`
    );
  }

  async processCommand(user: User, command: string, args: any[]): Promise<void> {
    switch (command) {
      case PLANT_COMMAND:
        return this.plant(user)
      case HARVEST_COMMAND:
        return this.harvest(user, args)
      case POLINATE_COMMAND:
        return this.polinate(user)
      case UNROOT_COMMAND:
        return this.unroot(user, args)
      case GIVE_COMMAND:
        return this.give(user, args)
    }
  }

  // withdraw full rdai balance to target account
  // @thegostep todo: permit withdraw of partial balance?
  // @thegostep todo: implement user gas payments
  async unroot(user: User, args: any[]): Promise<any> {
    const [_, target] = args;

    // get provider
    const provider = ethers.getDefaultProvider(process.env.NETWORK);
    // init contracts
    const rdai = new ethers.Contract(
      addresses[process.env.NETWORK].rDAI,
      abis.rDAI,
      provider
    );
    // get rdai balance
    const amt = await rdai.balanceOf(user.address);
    // assert non-zero balance
    if (amt.eq(0)) {
      throw new Error("insufficient rdai balance");
    }
    // prepare txs
    const txs = [];
    // redeem and transfer to target balance
    txs.push(await rdai.populateTransaction.redeemAndTransferAll(target));
    // @thegostep todo: assert sufficient gas money
    // submit txs to onboard.money
    console.log(txs);
    const txReceipt = await this.onboardmoney.sendBatch({ txs });
    // @itirabasso todo: notify db of successful command
  }

  // send full user dai balance to rdai contract
  // @thegostep todo: implement user gas payments
  async plant(user: User): Promise<any> {
    // get provider
    const provider = ethers.getDefaultProvider(process.env.NETWORK);
    // init contracts
    const rdai = new ethers.Contract(
      addresses[process.env.NETWORK].rDAI,
      abis.rDAI,
      provider
    );
    const dai = new ethers.Contract(
      addresses[process.env.NETWORK].DAI,
      abis.DAI,
      provider
    );
    // get dai balance
    const amt = await dai.balanceOf(user.address);
    // assert non-zero balance
    if (amt.eq(0)) {
      throw new Error("insufficient dai balance");
    }
    // get dai approval
    const approval = await dai.allowance(user.address, rdai.address);
    // check if hat exists
    const hat = await rdai.getHatByAddress(user.address);
    // prepare txs
    const txs = [];
    // approve dai transfer
    if (approval.lt(amt)) {
      // push approval tx
      txs.push(await dai.populateTransaction.approve(rdai.address, amt));
    }
    // add dai to hat
    if (hat.hatID) {
      // add dai to existing hat
      txs.push(
        await rdai.populateTransaction.mintWithSelectedHat(amt, hat.hatID)
      );
    } else {
      // add dai to new hat
      txs.push(
        await rdai.populateTransaction.mintWithNewHat(
          amt,
          [user.address, addresses[process.env.NETWORK].trees],
          [50, 50]
        )
      );
    }
    // @thegostep todo: assert sufficient gas money
    // submit txs to onboard.money
    console.log(txs);
    const txReceipt = await this.onboardmoney.sendBatch({ txs });
    // @itirabasso todo: notify db of successful command
  }

  async harvest(user: User, args: any[]): Promise<any> {
    const [word, target] = args;
    
  }

  async polinate(user: User): Promise<any> {}

  async give(user: User, args: any[]): Promise<any> {
    const [amount, _, __, target] = args;
  }
  
  

}
