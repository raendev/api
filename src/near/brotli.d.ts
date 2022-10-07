declare module 'brotli/decompress' {
  export default function decompress(buffer: Uint8Array, outputSize?: number): Uint8Array;
}