import * as naj from "near-api-js"

export * from './schema'

const mainnetConfig = {
  networkId: "mainnet",
  nodeUrl: "https://rpc.mainnet.near.org",
  walletUrl: "https://wallet.near.org",
  helperUrl: "https://helper.mainnet.near.org",
} as const

const testnetConfig = {
  networkId: "testnet",
  nodeUrl: "https://rpc.testnet.near.org",
  walletUrl: "https://wallet.testnet.near.org",
  helperUrl: "https://helper.testnet.near.org",
} as const

export class UnknownNetworkError extends Error {
  constructor(contract: string) {
    super(
      `Don't know what network settings to use for contract "${contract}". ` +
      `Expected name to end in 'testnet' or 'near'.`
    )
    this.name = 'UnknownNetworkError'
  }
}

export interface ContractInterface {
  contract: string,
  config: typeof testnetConfig | typeof mainnetConfig
  near: naj.Near
}

/**
 * Get config, NEAR object, wallet connection, and signIn function given a
 * contract account name/id.
 *
 * Memoizes return values so that same object references are always returned for
 * a given contract, so React won't rerender needlessly.
 *
 * @param contract Contract account id/name to sign in against
 */
export function init(contract: string): ContractInterface {
  const config = /near$/.test(contract)
    ? mainnetConfig
    : /testnet$/.test(contract) || /dev-[0-9]+-[0-9]+/.test(contract)
      ? testnetConfig
      : undefined

  if (!config) throw new UnknownNetworkError(contract)

  const near = new naj.Near({
    ...config,
    keyStore: new naj.keyStores.InMemoryKeyStore()
  })

  return {
    contract,
    config,
    near,
  }
}

