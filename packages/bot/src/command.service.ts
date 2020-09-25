import { getAddress } from '@ethersproject/address';
import { InfuraProvider } from '@ethersproject/providers';
import { Injectable, Logger, Inject } from '@nestjs/common';
import { App } from '@onboardmoney/sdk';
import { ethers, Contract, VoidSigner } from "ethers";

import addresses from "./contracts/addresses";
import abis from "./contracts/abis";
import { User, CommandContext, Tweet } from './types';

import { DatabaseService } from './database/database.service';
import { TwitterService } from './twitter.service';

const PLANT_COMMAND = "plant";
const UNROOT_COMMAND = "unroot";
const GIVE_COMMAND = "give";

@Injectable()
export class CommandService {
  rdai: Contract;
  dai: Contract;

  constructor(private readonly db: DatabaseService,
    private readonly twitter: TwitterService,
    @Inject("ONBOARD_MONEY") private readonly onboardmoney: App) {

    // get provider
    const provider = new InfuraProvider(process.env.NETWORK, process.env.INFURA_ID);

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

  async processCommand(user: User, tweet: Tweet, command: string, args: any[]): Promise<void> {
    const ctx = {
      user,
      tweet,
      command,
      args
    }
    switch (command) {
      case PLANT_COMMAND:
        return this.plant(ctx)
      case UNROOT_COMMAND:
        return this.unroot(ctx)
      case GIVE_COMMAND:
        return this.give(ctx)
      default:
        Logger.debug(`Unknown command ${command} ${args}`)
    }
  }

  // send full user dai balance to rdai contract
  // @thegostep todo: implement user gas payments
  async plant(ctx: CommandContext): Promise<any> {
    let { user, tweet } = ctx;
    let replyId;
    if (!user) {
      let userAddress;
      try { 
        const resp = await this.onboardmoney.createUser();
        userAddress = getAddress(resp.userAddress);

      } catch (err) {
        throw new Error('Unauthorize API KEY')
      }

      Logger.debug(`wallet created for ${tweet.author}: ${userAddress}`)
      user = await this.db.createUser(tweet.author, userAddress)
      const message = `@${tweet.author_name} send your dai to ${userAddress}`
      const resp = await this.twitter.reply(tweet, message)
      replyId = resp.id_str
      await this.db.addPendingTransfer(user.address, replyId)
    } else {
      Logger.debug(`Using existing user ${user.address}`)
      const message = `@${tweet.author_name} send your dai to ${user.address}`
      const resp = await this.twitter.reply(tweet, message)
      replyId = resp.id_str
    }
    await this.db.addPendingTransfer(user.address, replyId)
  }

  async doPlant(from: string, tweetId: string) {
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
    // FIXME : remove this!
    txs[0].gasLimit = 250000
    txs[1].gasLimit = 1855000

    const batch = { txs }
    Logger.debug(`sending batch => ${JSON.stringify(batch)}`)
    try {
      // submit txs to onboard.money
      const receipt = await this.onboardmoney.sendBatch(batch)
      // remove pending transfer
      await this.db.removePendingTransfer(getAddress(from))
      await this.twitter.reply(tweetId, "dai received!")
    } catch (e) {
      const err = e.toJSON()
      Logger.error(`${err.message}`)
      Logger.debug(`${JSON.stringify(err)}`)
    }
  }

  // withdraw full rdai balance to target account
  // @thegostep todo: permit withdraw of partial balance?
  // @thegostep todo: implement user gas payments
  async unroot(ctx: CommandContext): Promise<any> {
    const { user, args } = ctx
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
  }

  async give(ctx: CommandContext): Promise<any> {
    const { user, args } = ctx
    const [amount, _, __, target] = args;
  }

}
