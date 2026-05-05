import { createKeyPairSignerFromBytes } from '@solana/kit'
import { promises as fs } from 'node:fs'

import { decodeBase64 } from '../../shared/byte-encoding'
import { getEnv, getPublicBaseUrl } from '../env'

const defaultRpcUrl = 'https://api.devnet.solana.com'
const defaultWsUrl = 'wss://api.devnet.solana.com'

export interface CredentialMintingConfig {
  collectionAddress: string
  publicBaseUrl: string
  rpcUrl: string
  signer: Awaited<ReturnType<typeof createKeyPairSignerFromBytes>>
  wsUrl: string
}

export function getMintConfigStatus() {
  const publicBaseUrl = getEnv('CREDENTIALMINT_PUBLIC_BASE_URL') ?? getPublicBaseUrl()
  const signerConfigured = Boolean(getEnv('CREDENTIALMINT_DEVNET_SIGNER_KEYPAIR'))
  const collectionAddress = getEnv('CREDENTIALMINT_COLLECTION_ADDRESS')
  const collectionConfigured = Boolean(collectionAddress)
  const ready = Boolean(publicBaseUrl && signerConfigured && collectionConfigured)

  return {
    collectionAddress,
    collectionConfigured,
    executionMode: 'server-signed-devnet-mpl-core-credential-claim',
    publicBaseUrl,
    publicBaseUrlConfigured: Boolean(publicBaseUrl),
    ready,
    signerConfigured,
    status: ready ? 'ready' : !signerConfigured ? 'missing_signer' : 'missing_collection',
  }
}

export async function getMintingConfig(): Promise<CredentialMintingConfig> {
  const status = getMintConfigStatus()
  if (!status.ready || !status.collectionAddress) {
    throw new Error(`Credential minting is not ready: ${status.status}.`)
  }
  return {
    collectionAddress: status.collectionAddress,
    publicBaseUrl: status.publicBaseUrl,
    rpcUrl: getEnv('CREDENTIALMINT_DEVNET_RPC_URL') ?? defaultRpcUrl,
    signer: await createKeyPairSignerFromBytes(
      await loadSecretKey(getEnv('CREDENTIALMINT_DEVNET_SIGNER_KEYPAIR')!),
      false,
    ),
    wsUrl: getEnv('CREDENTIALMINT_DEVNET_WS_URL') ?? defaultWsUrl,
  }
}

async function loadSecretKey(raw: string): Promise<Uint8Array> {
  if (raw.startsWith('/') || raw.startsWith('./') || raw.startsWith('../') || raw.endsWith('.json')) {
    return parseSecretKey(await fs.readFile(raw, 'utf8'))
  }
  return parseSecretKey(raw)
}

function parseSecretKey(raw: string): Uint8Array {
  const normalized = raw.trim()
  if (normalized.startsWith('base64:')) {
    return decodeBase64(normalized.slice(7))
  }
  if (normalized.startsWith('[') && normalized.endsWith(']')) {
    return Uint8Array.from(JSON.parse(normalized) as number[])
  }
  if (normalized.includes(',')) {
    return Uint8Array.from(normalized.split(',').map((value) => Number(value.trim())))
  }
  throw new Error(
    'CREDENTIALMINT_DEVNET_SIGNER_KEYPAIR must be a keypair path, JSON array, comma list, or base64:value.',
  )
}
