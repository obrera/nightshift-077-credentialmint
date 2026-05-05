import { getBase64Decoder, getBase64Encoder } from '@solana/kit'

export function areBytesEqual(left: Uint8Array, right: Uint8Array) {
  if (left.length !== right.length) {
    return false
  }
  return left.every((byte, index) => byte === right[index])
}

export function decodeBase64(value: string) {
  return Uint8Array.from(getBase64Encoder().encode(value))
}

export function encodeBase64(value: Uint8Array) {
  return getBase64Decoder().decode(value)
}
