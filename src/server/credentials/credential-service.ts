import { assertIsAddress } from '@solana/kit'

import type { CredentialRecord } from '../storage/types'

import { isOperatorWallet } from '../auth/operator'
import { getPublicBaseUrl } from '../env'
import { mintCredential } from '../minting/mint-credential'
import { createCredential, getCredential, listCredentials, saveCredential } from '../storage/database'

export async function claimCredential(args: { credentialId: string; walletAddress: string }) {
  const credential = getCredential(args.credentialId)
  if (!credential) {
    throw new Error('Credential record not found.')
  }
  if (credential.learnerWallet !== args.walletAddress) {
    throw new Error('Only the approved learner wallet can claim this credential NFT.')
  }
  if (credential.status !== 'approved') {
    throw new Error('Credential must be approved and unclaimed before minting.')
  }
  const baseUrl = getPublicBaseUrl().replace(/\/$/, '')
  const metadataUrl = `${baseUrl}/api/metadata/${credential.id}.json`
  const imageUrl = `${baseUrl}/api/metadata/${credential.id}.svg`
  const minted = await mintCredential({
    courseTitle: credential.courseTitle,
    metadataUrl,
    walletAddress: credential.learnerWallet,
  })
  credential.assetAddress = minted.assetAddress
  credential.collectionAddress = minted.collectionAddress
  credential.explorerAssetUrl = minted.explorerAssetUrl
  credential.explorerTxUrl = minted.explorerTxUrl
  credential.imageUrl = imageUrl
  credential.metadataUrl = metadataUrl
  credential.status = 'claimed'
  credential.txSignature = minted.signature
  credential.updatedAt = new Date().toISOString()
  return saveCredential(credential)
}

export function createCredentialRecord(
  args: { operatorWallet: string } & Omit<CredentialRecord, 'createdAt' | 'id' | 'status' | 'updatedAt'>,
) {
  if (!isOperatorWallet(args.operatorWallet)) {
    throw new Error('Operator wallet is not allowlisted.')
  }
  try {
    assertIsAddress(args.learnerWallet)
  } catch {
    throw new Error('Learner wallet must be a valid Solana address.')
  }
  const now = new Date().toISOString()
  return createCredential({
    ...args,
    approvedAt: now,
    createdAt: now,
    id: crypto.randomUUID(),
    status: 'approved',
    updatedAt: now,
  })
}

export function getCredentialOrThrow(id: string) {
  const credential = getCredential(id)
  if (!credential) {
    throw new Error('Credential record not found.')
  }
  return credential
}

export function getVisibleCredentials(walletAddress: string, includeAll = false) {
  return listCredentials(includeAll && isOperatorWallet(walletAddress) ? undefined : walletAddress)
}
