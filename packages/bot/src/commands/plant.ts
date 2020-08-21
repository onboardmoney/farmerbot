import { User } from "src/types";
import { ethers } from "ethers";
import { App } from "@onboardmoney/sdk";

import addresses from "../contracts/addresses";
import abis from "../contracts/abis";

export const PLANT_COMMAND = "plant";

// send full user dai balance to rdai contract
// @thegostep todo: implement user gas payments
export async function plant(user: User): Promise<any> {
  // init onboard.money
  const onboardmoney = new App(
    process.env.OM_APIKEY,
    `https://${process.env.NETWORK}.onboard.money`
  );
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
  const txReceipt = await onboardmoney.sendBatch({ txs });
  // @itirabasso todo: notify db of successful command
}
