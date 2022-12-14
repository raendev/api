import { keyStores, Near } from "near-api-js"
import { UnknownNetwork } from "./errors"

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

export interface ContractInterface {
  contract: string,
  config: typeof testnetConfig | typeof mainnetConfig
  near: Near
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

  if (!config) throw new UnknownNetwork(contract)

  const near = new Near({
    ...config,
    keyStore: new keyStores.InMemoryKeyStore()
  })

  return {
    contract,
    config,
    near,
  }
}

