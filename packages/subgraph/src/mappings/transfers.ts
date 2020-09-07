import { Transfer } from "../types/schema";
import { Transfer as TransferEvent } from "../types/CeaErc20/erc20";
import { addToken } from "./tokens";

export function handleTransfer(event: TransferEvent): void {
  let transactionHash = event.transaction.hash.toHex();
  let transfer = new Transfer(transactionHash);
  transfer.from = event.params.src.toHexString()
  transfer.to = event.params.dst.toHexString()
  transfer.value = event.params.wad
  transfer.save();
  // addToken(event.transaction.to.toHex());
}
