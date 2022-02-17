import { PublicKey } from "@solana/web3.js"

const wallet = process.env.WALLET_ID
const MERCHANT_WALLE = new PublicKey(`${wallet}`)
module.exports.wallet = MERCHANT_WALLE
