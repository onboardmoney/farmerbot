import { User } from "src/types";

import { ethers, utils } from "ethers";
import IUniswapV2ERC20 from "@uniswap/v2-core/build/IUniswapV2ERC20.json";
import IUniswapV2Router01 from "@uniswap/v2-periphery/build/IUniswapV2Router01.json";


export async function swap(user: User, args: any[]): Promise<any> {
    const [amount, input, output] = args;
    console.log('swapping', amount, input, 'for', output)
    const UniswapRouterAddress = "0xf164fC0Ec4E93095b804a4795bBe1e041497b92a";
    const token = new utils.Interface(IUniswapV2ERC20 as any)
    const router = new utils.Interface(IUniswapV2Router01 as any)
    // getSwapParams("goerli")

    // const approveTxData = token.encodeFunctionData('approve', [UniswapRouterAddress, amount])
    // const swapTxData = router.encodeFunctionData(
    //   'swapExactTokensForTokens',
    //   [
    //     amountIn,
    //     amountOut,
    //     path,
    //     recipient,
    //     deadline
    //   ]
    // )

    // const approveTx = {
    //   from: user.address,
    //   to: tokenAddress,
    //   data: approveTxData
    // }

    // const swapTx = {
    //   from: user.address,
    //   to: UniswapRouterAddress,
    //   data: swapTxData
    // }
    // const txs = [approveTx, swapTx]
    // console.log(approveTx, swapTx)

    // const batch = {
    //   txs
    // }
    // this.app.evaluateBatch(batch)
  }
