let wallet = ""

if (process.env.WALLET_ID) {
  wallet = process.env.WALLET_ID
}

export { wallet }
