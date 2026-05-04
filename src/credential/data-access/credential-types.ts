export interface BootstrapStatus {
  minting: {
    collectionAddress?: string
    collectionConfigured: boolean
    executionMode: string
    publicBaseUrl: string
    ready: boolean
    signerConfigured: boolean
    status: string
  }
  operatorWalletsConfigured: number
}

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
  status: 'approved' | 'claimed' | 'draft' | 'revoked'
  txSignature?: string
  updatedAt: string
}

export interface CredentialSession {
  expiresAt: string
  isOperator: boolean
  token: string
  walletAddress: string
}
