export class UnknownNetwork extends Error {
  constructor(contract: string) {
    super(
      `Don't know what network settings to use for contract "${contract}". ` +
      `Expected name to end in 'testnet' or 'near'.`
    )
    this.name = "UnknownNetwork"
  }
}

export class NoCustomSection extends Error {
  constructor() {
    super("Contract Wasm does not have a custom section called \"json\"")
    this.name = "NoCustomSection"
  }
}

export class DecompressionFailure extends Error {
  constructor() {
    super("Failed to decompile custom section")
    this.name = "DecompressionFailure"
  }
}
