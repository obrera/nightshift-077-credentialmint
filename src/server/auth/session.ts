import { getBase58Encoder } from '@solana/codecs-strings'
import { createSignInMessage } from '@solana/wallet-standard-util'
import { verifyMessageSignature } from '@solana/wallet-standard-util'
import { createHash, randomBytes } from 'node:crypto'

import { getPublicBaseUrl } from '../env'
import { consumeNonce, getSession, saveNonce, saveSession } from '../storage/database'

const nonceMinutes = 10
const sessionHours = 24

export interface AuthSession {
  expiresAt: string
  token: string
  walletAddress: string
}

export function createNonce(walletAddress?: string) {
  const now = new Date()
  const expiresAt = new Date(now.getTime() + nonceMinutes * 60 * 1000)
  const nonce = randomBytes(16).toString('base64url')
  const publicBaseUrl = getPublicBaseUrl()
  saveNonce({ expiresAt: expiresAt.toISOString(), issuedAt: now.toISOString(), nonce, walletAddress })
  return {
    expiresAt: expiresAt.toISOString(),
    input: {
      domain: new URL(publicBaseUrl).host,
      nonce,
      statement: 'Sign in to CredentialMint to issue, claim, and verify academic credential NFTs.',
      uri: publicBaseUrl,
      version: '1',
      ...(walletAddress ? { address: walletAddress } : {}),
    },
    nonce,
  }
}

export function getAuthSession(authHeader?: null | string): AuthSession | undefined {
  if (!authHeader?.startsWith('Bearer ')) {
    return undefined
  }
  const token = authHeader.slice('Bearer '.length)
  const session = getSession(token)
  if (!session || new Date(session.expiresAt).getTime() < Date.now()) {
    return undefined
  }
  return { expiresAt: session.expiresAt, token: session.token, walletAddress: session.walletAddress }
}

export async function verifySignInPayload(
  input: { address: string; domain: string; nonce: string; statement?: string; uri: string; version: string },
  output: { signature: string; signedMessage?: string },
): Promise<AuthSession> {
  const nonceRecord = consumeNonce(input.nonce)
  if (!nonceRecord) {
    throw new Error('Nonce was not found or has already been used.')
  }
  if (new Date(nonceRecord.expiresAt).getTime() < Date.now()) {
    throw new Error('Nonce has expired.')
  }
  if (nonceRecord.walletAddress && nonceRecord.walletAddress !== input.address) {
    throw new Error('Nonce wallet does not match signed address.')
  }

  const expectedMessage = createSignInMessage(input)
  const signedMessage = output.signedMessage
    ? Buffer.from(output.signedMessage, 'base64')
    : Buffer.from(expectedMessage)
  const signature = Buffer.from(output.signature, 'base64')
  const verified = verifyMessageSignature({
    message: expectedMessage,
    publicKey: Uint8Array.from(getBase58Encoder().encode(input.address)),
    signature,
    signedMessage,
  })
  if (!verified || Buffer.compare(Buffer.from(expectedMessage), signedMessage) !== 0) {
    throw new Error('Wallet signature verification failed.')
  }

  const now = new Date()
  const expiresAt = new Date(now.getTime() + sessionHours * 60 * 60 * 1000)
  const token = createHash('sha256')
    .update(`${input.address}:${randomBytes(32).toString('hex')}`)
    .digest('base64url')
  saveSession({ createdAt: now.toISOString(), expiresAt: expiresAt.toISOString(), token, walletAddress: input.address })
  return { expiresAt: expiresAt.toISOString(), token, walletAddress: input.address }
}
