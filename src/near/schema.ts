import { init } from "."
import { readCustomSection } from "wasm-walrus-tools"
import brotliDecompress from 'brotli/decompress';
import type { Near } from "near-api-js"
import type { ContractCodeView } from "near-api-js/lib/providers/provider"
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

async function fetchJsonAddressOrData(contract: string, near: Near): Promise<string> {
  const code = await near.connection.provider.query({
    account_id: contract,
    finality: 'final',
    request_type: 'view_code',
  }) as ContractCodeView
  const wasmStr = atob(code.code_base64)
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
