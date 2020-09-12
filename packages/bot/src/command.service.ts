import { Injectable, Logger, Inject } from '@nestjs/common';
import { App, TxRequestDto } from '@onboardmoney/sdk';
import { ethers, Contract, PopulatedTransaction, VoidSigner } from "ethers";

import addresses from "./contracts/addresses";
import abis from "./contracts/abis";
import { User, Tweet } from './types';

import { DatabaseService } from './database/database.service';

const PLANT_COMMAND = "plant";
const UNROOT_COMMAND = "unroot";
const GIVE_COMMAND = "give";

@Injectable()
export class CommandService {
  rdai: Contract;
  dai: Contract;

  constructor(private readonly db: DatabaseService,
    @Inject("ONBOARD_MONEY") private readonly onboardmoney: App) {

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
        Logger.debug(`Unknown command ${command} ${args}`)
    }
  }

  // send full user dai balance to rdai contract
  // @thegostep todo: implement user gas payments
  async plant(user: User): Promise<any> {
    console.log(user.userId, user.address, " plants")
    await this.db.addPendingTransfer(user.address, [])
  }

  async doPlant(from: string) {
    Logger.debug(`${from} transfered tokens`)
    // @thegostep todo: assert sufficient gas money

    // let populated txs include from param
    const signer = new VoidSigner(from)
    const dai = this.dai.connect(signer)
    const rdai = this.rdai.connect(signer)

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
      txs.push(await dai.populateTransaction.approve(this.rdai.address, amt));
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
          [from, addresses[process.env.NETWORK].trees],
          [50, 50]
        )
      );
    }

    const batch = { txs }
    Logger.debug(`sending batch => ${batch}`)

    try {
      // submit txs to onboard.money
      const receipt = await this.onboardmoney.sendBatch(batch)
      // remove pending transfer
      await this.db.removePendingTransfer(from)
      // @itirabasso todo: notify db of successful command
    } catch (e) {
      console.log('error sending batch', e)
    }
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
