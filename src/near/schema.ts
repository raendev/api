import { init } from "."
import { Buffer } from "node:buffer"
import { readCustomSection } from "wasm-walrus-tools"
import brotliDecompress from 'brotli/decompress';
import type { Near } from "near-api-js"
import type { ContractCodeView } from "near-api-js/lib/providers/provider"
import type { JSONSchema7 } from "json-schema"

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

class NoCustomSection extends Error {
  constructor() {
    super("Contract Wasm does not have a custom section called \"json\"")
  }
}

class DecompressionFailure extends Error {
  constructor() {
    super("Failed to decompile custom section")
  }
}

async function fetchJsonAddressOrData(contract: string, near: Near): Promise<string> {
  const code = await near.connection.provider.query({
    account_id: contract,
    finality: 'final',
    request_type: 'view_code',
  }) as ContractCodeView
  const wasm = Buffer.from(code.code_base64, "base64")
  const jsonCustomSection = await readCustomSection(wasm, "json")
  if (!jsonCustomSection) {
    throw new NoCustomSection()
  }

  let startOfJson = Buffer.from(jsonCustomSection.slice(0, 20)).toString('utf8');
  // if link return string
  if (startOfJson.startsWith("https://")) {
    return Buffer.from(jsonCustomSection).toString('utf8');
  }
  // Else is compressed data
  let decompressedData = brotliDecompress(jsonCustomSection);

  if (!decompressedData) {
    throw new DecompressionFailure()
  }
  return Buffer.from(decompressedData).toString("utf8");
}