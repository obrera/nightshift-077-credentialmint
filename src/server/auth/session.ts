import { getBase58Encoder } from '@solana/codecs-strings'
import { createSignInMessage } from '@solana/wallet-standard-util'
import { verifyMessageSignature } from '@solana/wallet-standard-util'
import { getRandomValues, randomUUID } from 'node:crypto'

import { areBytesEqual, decodeBase64 } from '../../shared/byte-encoding'
import { getPublicBaseUrl } from '../env'
import { consumeNonce, getSession, saveNonce, saveSession } from '../storage/database'

const nonceMinutes = 10
const sessionHours = 24

export interface AuthSession {
  expiresAt: string
  token: string
  walletAddress: string
}

export interface CredentialClaimInput {
  credentialId: string
  message: string
  nonce: string
  walletAddress: string
}

export function createCredentialClaimInput(args: { courseTitle: string; credentialId: string; walletAddress: string }) {
  const now = new Date()
  const expiresAt = new Date(now.getTime() + nonceMinutes * 60 * 1000)
  const nonce = `claim:${randomUUID()}`
  saveNonce({
    expiresAt: expiresAt.toISOString(),
    issuedAt: now.toISOString(),
    nonce,
    walletAddress: args.walletAddress,
  })
  const message = formatCredentialClaimMessage({
    courseTitle: args.courseTitle,
    credentialId: args.credentialId,
    issuedAt: now.toISOString(),
    nonce,
    walletAddress: args.walletAddress,
  })
  return {
    expiresAt: expiresAt.toISOString(),
    input: {
      credentialId: args.credentialId,
      message,
      nonce,
      walletAddress: args.walletAddress,
    },
  }
}

export function createNonce(walletAddress?: string) {
  const now = new Date()
  const expiresAt = new Date(now.getTime() + nonceMinutes * 60 * 1000)
  const nonce = randomUUID()
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

export function verifyCredentialClaimPayload(
  args: { courseTitle: string; credentialId: string; input: CredentialClaimInput; walletAddress: string },
  output: { signature: string; signedMessage?: string },
) {
  if (args.input.credentialId !== args.credentialId) {
    throw new Error('Claim credential does not match request.')
  }
  if (args.input.walletAddress !== args.walletAddress) {
    throw new Error('Claim wallet does not match authenticated wallet.')
  }
  if (!args.input.nonce.startsWith('claim:')) {
    throw new Error('Claim nonce is not valid for credential claims.')
  }
  const nonceRecord = consumeNonce(args.input.nonce)
  if (!nonceRecord) {
    throw new Error('Claim nonce was not found or has already been used.')
  }
  if (new Date(nonceRecord.expiresAt).getTime() < Date.now()) {
    throw new Error('Claim nonce has expired.')
  }
  if (nonceRecord.walletAddress !== args.walletAddress) {
    throw new Error('Claim nonce wallet does not match authenticated wallet.')
  }

  const expectedMessage = new TextEncoder().encode(
    formatCredentialClaimMessage({
      courseTitle: args.courseTitle,
      credentialId: args.credentialId,
      issuedAt: nonceRecord.issuedAt,
      nonce: args.input.nonce,
      walletAddress: args.walletAddress,
    }),
  )
  const signedMessage = output.signedMessage ? decodeBase64(output.signedMessage) : expectedMessage
  const signature = decodeBase64(output.signature)
  const verified = verifyMessageSignature({
    message: expectedMessage,
    publicKey: Uint8Array.from(getBase58Encoder().encode(args.walletAddress)),
    signature,
    signedMessage,
  })
  if (
    !verified ||
    !areBytesEqual(expectedMessage, signedMessage) ||
    !areBytesEqual(expectedMessage, new TextEncoder().encode(args.input.message))
  ) {
    throw new Error('Credential claim signature verification failed.')
  }
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
  const signedMessage = output.signedMessage ? decodeBase64(output.signedMessage) : expectedMessage
  const signature = decodeBase64(output.signature)
  const verified = verifyMessageSignature({
    message: expectedMessage,
    publicKey: Uint8Array.from(getBase58Encoder().encode(input.address)),
    signature,
    signedMessage,
  })
  if (!verified || !areBytesEqual(expectedMessage, signedMessage)) {
    throw new Error('Wallet signature verification failed.')
  }

  const now = new Date()
  const expiresAt = new Date(now.getTime() + sessionHours * 60 * 60 * 1000)
  const tokenEntropy = new Uint8Array(32)
  getRandomValues(tokenEntropy)
  const token = `${input.address}.${randomUUID()}.${Array.from(tokenEntropy, (byte) => byte.toString(16).padStart(2, '0')).join('')}`
  saveSession({ createdAt: now.toISOString(), expiresAt: expiresAt.toISOString(), token, walletAddress: input.address })
  return { expiresAt: expiresAt.toISOString(), token, walletAddress: input.address }
}

function formatCredentialClaimMessage(args: {
  courseTitle: string
  credentialId: string
  issuedAt: string
  nonce: string
  walletAddress: string
}) {
  const publicBaseUrl = getPublicBaseUrl()
  return [
    'CredentialMint credential NFT claim',
    `Domain: ${new URL(publicBaseUrl).host}`,
    `URI: ${publicBaseUrl}`,
    `Wallet: ${args.walletAddress}`,
    `Credential ID: ${args.credentialId}`,
    `Course: ${args.courseTitle}`,
    `Nonce: ${args.nonce}`,
    `Issued At: ${args.issuedAt}`,
    'Statement: I am signing to receive this MPL Core academic credential NFT into my connected wallet.',
  ].join('\n')
}
