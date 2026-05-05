import { signAsync } from '@noble/ed25519'
import { mkdirSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

import { encodeBase64 } from '../src/shared/byte-encoding'

function requireEnv(name: string): string {
  const value = process.env[name]?.trim()
  if (!value) {
    throw new Error(`${name} is required for live mint proof.`)
  }
  return value
}

const cleanupDataDir = !process.env.CREDENTIALMINT_DATA_DIR
process.env.CREDENTIALMINT_DATA_DIR ??= join(tmpdir(), `credentialmint-live-proof-${Date.now()}`)
process.env.CREDENTIALMINT_PUBLIC_BASE_URL ??= 'http://localhost:3999'
requireEnv('CREDENTIALMINT_DEVNET_SIGNER_KEYPAIR')
requireEnv('CREDENTIALMINT_COLLECTION_ADDRESS')

const { getMintingConfig, loadSecretKey } = await import('../src/server/minting/config')

const mintingConfig = await getMintingConfig()
const operatorWallet = process.env.CREDENTIALMINT_PROOF_OPERATOR_WALLET?.trim() || mintingConfig.signer.address
const learnerWallet = process.env.CREDENTIALMINT_PROOF_LEARNER_WALLET?.trim() || mintingConfig.signer.address
process.env.CREDENTIALMINT_OPERATOR_WALLETS = operatorWallet

const { claimCredential, createCredentialClaimChallenge, createCredentialRecord } =
  await import('../src/server/credentials/credential-service')

mkdirSync(process.env.CREDENTIALMINT_DATA_DIR, { recursive: true })

async function main() {
  const credential = createCredentialRecord({
    completionDate: '2026-05-04',
    courseTitle: 'Applied MPL Core Credentialing',
    credentialType: 'Certificate of Completion',
    evidenceUrl: 'https://credentialmint077.colmena.dev/api/metadata/collection.json',
    grade: 'verified',
    issuerName: 'CredentialMint Academy',
    learnerName: 'Live Proof Learner',
    learnerWallet,
    operatorNotes: 'Live proof minted by the CredentialMint verifier.',
    operatorWallet,
  })
  const claimChallenge = createCredentialClaimChallenge({ credentialId: credential.id, walletAddress: learnerWallet })
  const secretKey = await loadSecretKey(process.env.CREDENTIALMINT_DEVNET_SIGNER_KEYPAIR!)
  const signature = await signAsync(new TextEncoder().encode(claimChallenge.input.message), secretKey.slice(0, 32))
  const claimed = await claimCredential({
    credentialId: credential.id,
    input: claimChallenge.input,
    output: { signature: encodeBase64(signature) },
    walletAddress: learnerWallet,
  })
  if (!claimed.assetAddress || !claimed.txSignature || claimed.status !== 'claimed') {
    throw new Error('Credential claim did not persist minted asset proof.')
  }
  console.log(
    JSON.stringify(
      {
        assetAddress: claimed.assetAddress,
        collectionAddress: claimed.collectionAddress,
        credentialId: claimed.id,
        explorerAssetUrl: claimed.explorerAssetUrl,
        explorerTxUrl: claimed.explorerTxUrl,
        metadataUrl: claimed.metadataUrl,
        status: claimed.status,
        txSignature: claimed.txSignature,
      },
      null,
      2,
    ),
  )
}

main()
  .catch((error) => {
    console.error(error)
    process.exitCode = 1
  })
  .finally(() => {
    if (cleanupDataDir) {
      rmSync(process.env.CREDENTIALMINT_DATA_DIR!, { force: true, recursive: true })
    }
  })
