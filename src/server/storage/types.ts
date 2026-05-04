export interface CredentialRecord {
  approvedAt?: string
  assetAddress?: string
  collectionAddress?: string
  completionDate: string
  courseTitle: string
  createdAt: string
  credentialType: string
  evidenceUrl?: string
  explorerAssetUrl?: string
  explorerTxUrl?: string
  grade?: string
  id: string
  imageUrl?: string
  issuerName: string
  learnerName: string
  learnerWallet: string
  metadataUrl?: string
  operatorNotes?: string
  operatorWallet?: string
  status: CredentialStatus
  txSignature?: string
  updatedAt: string
}

export type CredentialStatus = 'approved' | 'claimed' | 'draft' | 'revoked'

export interface NonceRecord {
  expiresAt: string
  issuedAt: string
  nonce: string
  walletAddress?: string
}

export interface SessionRecord {
  createdAt: string
  expiresAt: string
  token: string
  walletAddress: string
}
