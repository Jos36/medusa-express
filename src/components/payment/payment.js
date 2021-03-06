import React, { useContext, useEffect, useRef, useState } from "react"
import OrderContext from "../../context/order-context"
import PaymentForm from "./payment-form"
// solana imports
import { wallet } from "../../utils/wallet"
import { clusterApiUrl, Connection } from "@solana/web3.js"
import { Keypair, PublicKey } from "@solana/web3.js"
import {
  encodeURL,
  createQR,
  findTransactionSignature,
  FindTransactionSignatureError,
  validateTransactionSignature,
} from "@solana/pay"
import BigNumber from "bignumber.js"

const Payment = () => {
  // console.log(`${process.env.MERCHANT_WALLET}`)
  // console.log(wallet)
  // const MERCHANT_WALLE = new PublicKey(process.env.MERCHANT_WALLET)
  // console.log(MERCHANT_WALLE)
  const [priceInSol, setPriceInSol] = useState()
  const { order, completeOrder, orderStatus } = useContext(OrderContext)
  const { cart } = useContext(OrderContext)
  const [qr, setQr] = useState(null)
  const ref = useRef(null)
  const getPrice = () => {
    let headers = new Headers()

    headers.append("Content-Type", "application/json")
    headers.append("Accept", "application/json")
    headers.append("Origin", "https://medusa-express.vercel.app")

    require("axios")
      .get(`https://api.coingecko.com/api/v3/coins/solana`)
      .then(response => {
        const price =
          ((cart.total / 100) * (1 + cart.region.tax_rate / 100)) /
          response.data.market_data.current_price.usd
        const priceNum = `${price}`.split(".").join("")
        setPriceInSol(priceNum)
        console.log(priceNum)
      })
  }
  // add the QR code to the page
  useEffect(() => {
    qr?.append(ref.current)
  }, [qr])

  // handel the payment with solana

  const handelSolana = async function () {
    // Variable to keep state of the payment status
    let paymentStatus = ""
    // Connecting to devnet for this example
    console.log("1. ✅ Establish connection to the network")
    const connection = new Connection(
      clusterApiUrl("mainnet-beta"),
      "confirmed"
    )

    // fake data
    console.log("2. 🛍 Simulate a customer checkout \n")

    const price = getPrice()
    const amount = new BigNumber(`0.00000000${priceInSol}`)
    console.log(amount)
    const MERCHANT_WALLET = new PublicKey(
      `7WUjHN6UmD8YFL5ge2NJxFyVCJ1ycKDS78Jot4QN8NHJ`
    )
    console.log(MERCHANT_WALLET)
    const reference = new Keypair().publicKey
    const label = "Jungle Cats store"
    const message = "Jungle Cats store - your order - #001234"
    const memo = "JC#4098"

    //   make payment url
    console.log("3. 💰 Create a payment request link \n")
    const url = encodeURL({
      recipient: MERCHANT_WALLET,
      amount,
      reference,
      label,
      message,
      memo,
    })
    const size = 320
    console.log(url)
    setQr(createQR(url, size))
    let signatureInfo

    const { signature } = await new Promise((resolve, reject) => {
      /**
       * Retry until we find the transaction
       *
       * If a transaction with the given reference can't be found, the `findTransactionSignature`
       * function will throw an error. There are a few reasons why this could be a false negative:
       *
       * - Transaction is not yet confirmed
       * - Customer is yet to approve/complete the transaction
       *
       *
       */

      //  a polling strategy to query for the transaction periodically.
      const interval = setInterval(async () => {
        console.count("Checking for transaction...")
        try {
          signatureInfo = await findTransactionSignature(
            connection,
            reference,
            undefined,
            "confirmed"
          )
          console.log("\n 🖌  Signature found: ", signatureInfo.signature)
          clearInterval(interval)
          resolve(signatureInfo)
        } catch (error) {
          if (!(error instanceof FindTransactionSignatureError)) {
            console.error(error)
            clearInterval(interval)
            reject(error)
          }
        }
      }, 500)
    })

    console.log("\n6. 🔗 Validate transaction \n")

    try {
      await validateTransactionSignature(
        connection,
        signature,
        MERCHANT_WALLET,
        amount,
        undefined,
        reference
      )

      // Update payment status
      paymentStatus = "validated"
      console.log("✅ Payment validated")
      console.log("📦 Ship order to customer")
    } catch (error) {
      console.error("❌ Payment failed", error)
    }
    completeOrder()
  }

  return (
    <div>
      {priceInSol ? "" : getPrice()}
      {qr ? (
        <button style={qr ? { cursor: "not-allowed" } : {}}>waiting </button>
      ) : (
        <button
          onClick={() => {
            handelSolana()
          }}
        >
          pay with solana
        </button>
      )}

      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
        }}
        ref={ref}
      />
    </div>
  )
}

export default Payment
