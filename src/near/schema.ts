import fs from 'node:fs/promises'
import path from 'node:path'
import { init } from "."
import { readCustomSection } from "wasm-walrus-tools"
import brotliDecompress from 'brotli/decompress';
import type { Near } from "near-api-js"
import type { AccountView, ContractCodeView } from "near-api-js/lib/providers/provider"
import type { JSONSchema7 } from "json-schema"
import { DecompressionFailure, NoCustomSection } from "./errors"

export async function fetchSchema(contract: string): Promise<JSONSchema7> {
  const { near } = init(contract)

  const urlOrData = await fetchJsonAddressOrData(contract, near)

  // TODO cache schema JSON in localeStorage, return early here if available

  if (urlOrData.startsWith("https://")) {
    const schema = await fetch(urlOrData)
      .then((response) => {
        if (!response.ok) throw new Error(`HTTP error! Status: ${response.status}`)
        return response.json()
      })
    return schema;
  }

  const schema = JSON.parse(urlOrData)

  // TODO validate schema adheres to JSONSchema7
  return schema
}

interface CachedCode {
  code_hash: string
  code_base64: string
}

/**
 * Fetch base64-encoded code for given `contract` from the cache, if it's there,
 * otherwise fetch it from RPC and write it to cache.
 * 
 * If cached version found, it will be returned immediately, and a background
 * process will check if it's fresh and update it if necessary.
 */
async function getContractCode(contract: string, near: Near): Promise<string> {
  const cachePath = path.resolve(`src/near/cache/${contract}.json`)
  let cached: CachedCode
  try {
    cached = JSON.parse(
      await fs.readFile(cachePath, 'utf-8')
    )
    return cached.code_base64
  } catch {
    const [{ code_hash }, { code_base64 }] = await Promise.all([
      near.connection.provider.query({
        account_id: contract,
        finality: 'final',
        request_type: 'view_account',
      }),
      near.connection.provider.query({
        account_id: contract,
        finality: 'final',
        request_type: 'view_code',
      })
    ]) as [AccountView, ContractCodeView]
    await fs.writeFile(
      cachePath,
      JSON.stringify({ code_hash, code_base64 }),
      'utf-8'
    )
    return code_base64
  }
  // TODO: move to separate cloud function, which we call in a fire-and-forget way
  // const { code_hash } = await near.connection.provider.query({
  //   account_id: contract,
  //   finality: 'final',
  //   request_type: 'view_account',
  // }) as AccountView
  // if (cached.code_hash !== code_hash) {
  //   const { code_base64 } = await near.connection.provider.query({
  //     account_id: contract,
  //     finality: 'final',
  //     request_type: 'view_code',
  //   }) as ContractCodeView
  //   await fs.writeFile(
  //     cachePath,
  //     JSON.stringify({ code_hash, code_base64 }),
  //     'utf-8'
  //   )
  // }
}

async function fetchJsonAddressOrData(contract: string, near: Near): Promise<string> {
  const code_base64 = await getContractCode(contract, near)
  const wasmStr = atob(code_base64)
  const wasm = new Uint8Array(new ArrayBuffer(wasmStr.length));
  for (let i = 0; i < wasmStr.length; i++) { wasm[i] = wasmStr.charCodeAt(i) }
  const jsonCustomSection = await readCustomSection(wasm, "json")
  if (!jsonCustomSection) {
    throw new NoCustomSection()
  }

  let startOfJson = new TextDecoder().decode(jsonCustomSection.slice(0, 20))
  // if link return string
  if (startOfJson.startsWith("https://")) {
    return new TextDecoder().decode(jsonCustomSection)
  }
  // Else is compressed data
  let decompressedData = brotliDecompress(jsonCustomSection);

  if (!decompressedData) {
    throw new DecompressionFailure()
  }
  return new TextDecoder().decode(decompressedData)
}
