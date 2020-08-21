import { User } from "src/types";
import { ethers } from "ethers";
import { App } from "@onboardmoney/sdk";

import addresses from "../contracts/addresses";
import abis from "../contracts/abis";

export const UNROOT_COMMAND = "polinate";

// withdraw full rdai balance to target account
// @thegostep todo: permit withdraw of partial balance?
export async function unroot(user: User, args: any[]): Promise<any> {
  const [_, target] = args;
  // init onboard.money
  const onboardmoney = new App(
    process.env.OM_APIKEY,
    `https://${process.env.NETWORK}.onboard.money`
  );
  // get provider
  const provider = ethers.getDefaultProvider(process.env.NETWORK);
  // init contracts
  const rdai = new ethers.Contract(addresses.rDAI, abis.rDAI, provider);
  const dai = new ethers.Contract(addresses.DAI, abis.DAI, provider);
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
  const txReceipt = await onboardmoney.sendBatch({ txs });
  // @itirabasso todo: notify db of successful command
}
