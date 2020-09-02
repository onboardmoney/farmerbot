import { Injectable } from '@nestjs/common';
import { App } from '@onboardmoney/sdk';
import { ethers, Contract, PopulatedTransaction } from "ethers";

import addresses from "./contracts/addresses";
import abis from "./contracts/abis";
import { User, Tweet } from './types';

import { DatabaseService } from './database/database.service';

const PLANT_COMMAND = "plant";
const UNROOT_COMMAND = "unroot";
const GIVE_COMMAND = "give";

@Injectable()
export class CommandService {
  onboardmoney: App;
  rdai: Contract;
  dai: Contract;

  constructor(private readonly db: DatabaseService) {
    // init onboard.money
    this.onboardmoney = new App(
      process.env.OM_APIKEY,
      `https://${process.env.NETWORK}.onboard.money`
    );

    // get provider
    const provider = ethers.getDefaultProvider(process.env.NETWORK);

    // init contracts
    this.rdai = new ethers.Contract(
      addresses[process.env.NETWORK].rDAI,
      abis.rDAI,
      provider
    );
    this.dai = new ethers.Contract(
      addresses[process.env.NETWORK].DAI,
      abis.DAI,
      provider
    );

  }

  async processCommand(user: User, command: string, args: any[]): Promise<void> {
    switch (command) {
      case PLANT_COMMAND:
        return this.plant(user)
      case UNROOT_COMMAND:
        return this.unroot(user, args)
      case GIVE_COMMAND:
        return this.give(user, args)
      default:
        console.log('unknown command')
        // console.log('unknown command', command, args, user)
    }
  }

  // send full user dai balance to rdai contract
  // @thegostep todo: implement user gas payments
  async plant(user: User): Promise<any> {
    // @thegostep todo: assert sufficient gas money
    // submit txs to onboard.money
    // console.log(txs);
    // const txReceipt = await this.onboardmoney.sendBatch({ txs });
    // @itirabasso todo: notify db of successful command
    // this.db.createEvent("plant", txReceipt)
    console.log(user.userId, user.address, " plants")
    await this.db.addPendingTransfer(user.address, [])
  }

  async doPlant(from: string) {
    console.log(from, " transfered tokens")

    // get dai balance
    const amt = await this.dai.balanceOf(from);
    // assert non-zero balance
    if (amt.eq(0)) {
      throw new Error("insufficient dai balance");
    }

    // get dai approval
    const approval = await this.dai.allowance(from, this.rdai.address);
    // check if hat exists
    const hat = await this.rdai.getHatByAddress(from);
    // prepare txs
    // FIXME : OM's TxBatchDto.txs it's incompatible with ethers' PopulateTransaction
    const txs: any[] = [];
    // approve dai transfer
    if (approval.lt(amt)) {
      // push approval tx
      txs.push(await this.dai.populateTransaction.approve(this.rdai.address, amt));
    }
    
    // add dai to hat
    if (hat.hatID) {
      // add dai to existing hat
      txs.push(
        await this.rdai.populateTransaction.mintWithSelectedHat(amt, hat.hatID)
      );
    } else {
      // add dai to new hat
      txs.push(
        await this.rdai.populateTransaction.mintWithNewHat(
          amt,
          [from, addresses[process.env.NETWORK].trees],
          [50, 50]
        )
      );
    }

    // const txs = await this.db.getPendingTransfer(from)
    console.log('txs.length', txs.length)
    await this.onboardmoney.sendBatch({ txs })
  }

  // withdraw full rdai balance to target account
  // @thegostep todo: permit withdraw of partial balance?
  // @thegostep todo: implement user gas payments
  async unroot(user: User, args: any[]): Promise<any> {
    const [_, target] = args;
    // get rdai balance
    const amt = await this.rdai.balanceOf(user.address);
    // assert non-zero balance
    if (amt.eq(0)) {
      throw new Error("insufficient rdai balance");
    }
    // prepare txs
    const txs = [];
    // redeem and transfer to target balance
    txs.push(await this.rdai.populateTransaction.redeemAndTransferAll(target));
    // @thegostep todo: assert sufficient gas money
    // submit txs to onboard.money
    console.log(txs);
    const txReceipt = await this.onboardmoney.sendBatch({ txs });
    this.db.createEvent("unroot", txReceipt)
  }

  async give(user: User, args: any[]): Promise<any> {
    const [amount, _, __, target] = args;
  }

}
