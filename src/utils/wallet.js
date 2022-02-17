import { PublicKey } from "@solana/web3.js"

const wallet = process.env.WALLET_ID
if (wallet){

    export const MERCHANT_WALLE = new PublicKey(`${wallet}`)
}
