import { createSignInMessage } from '@solana/wallet-standard-util'
import { mkdirSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

import { encodeBase64 } from '../src/shared/byte-encoding'

process.env.CREDENTIALMINT_DATA_DIR = join(tmpdir(), `credentialmint-proof-${Date.now()}`)
process.env.CREDENTIALMINT_PUBLIC_BASE_URL = 'http://localhost:3999'
process.env.CREDENTIALMINT_OPERATOR_WALLETS = '11111111111111111111111111111111'

const { isOperatorWallet } = await import('../src/server/auth/operator')
const { createNonce, verifySignInPayload } = await import('../src/server/auth/session')
const {
  claimCredential,
  createCredentialClaimChallenge,
  createCredentialRecord,
  createDemoCredentialRecord,
  getCredentialOrThrow,
} = await import('../src/server/credentials/credential-service')

mkdirSync(process.env.CREDENTIALMINT_DATA_DIR, { recursive: true })

async function main() {
  const operatorWallet = '11111111111111111111111111111111'
  const learnerWallet = '11111111111111111111111111111111'
  if (!isOperatorWallet(operatorWallet)) {
    throw new Error('Operator allowlist check failed.')
  }

  const nonce = createNonce(learnerWallet)
  const message = createSignInMessage(nonce.input)
  if (!message.byteLength || nonce.input.address !== learnerWallet) {
    throw new Error('SIWS nonce/message construction failed.')
  }
  try {
    await verifySignInPayload(nonce.input, {
      signature: encodeBase64(Uint8Array.from({ length: 64 }, (_, index) => index + 1)),
    })
    throw new Error('Invalid signature was accepted.')
  } catch (error) {
    if (!(error instanceof Error) || !error.message.includes('Wallet signature verification failed')) {
      throw error
    }
  }

  const credential = createCredentialRecord({
    completionDate: '2026-05-04',
    courseTitle: 'Applied Solana Credentialing',
    credentialType: 'Certificate of Completion',
    evidenceUrl: 'https://example.edu/records/cm-077',
    grade: 'pass',
    issuerName: 'CredentialMint Academy',
    learnerName: 'Bee Learner',
    learnerWallet,
    operatorNotes: 'Proof script record.',
    operatorWallet,
  })
  const stored = getCredentialOrThrow(credential.id)
  if (stored.status !== 'approved' || stored.learnerWallet !== learnerWallet) {
    throw new Error('Credential approval persistence failed.')
  }

  const demoCredential = createDemoCredentialRecord({ learnerWallet })
  if (demoCredential.status !== 'approved' || demoCredential.learnerWallet !== learnerWallet) {
    throw new Error('Demo credential path did not create an approved learner credential.')
  }
  const repeatedDemoCredential = createDemoCredentialRecord({ learnerWallet })
  if (repeatedDemoCredential.id !== demoCredential.id) {
    throw new Error('Demo credential path should reuse the visitor demo record for the learner wallet.')
  }
  const claimChallenge = createCredentialClaimChallenge({
    credentialId: demoCredential.id,
    walletAddress: learnerWallet,
  })
  if (!claimChallenge.input.message.includes('I am signing to receive this MPL Core academic credential NFT')) {
    throw new Error('Credential claim challenge did not require a receive signature statement.')
  }
  try {
    await claimCredential({
      credentialId: demoCredential.id,
      input: claimChallenge.input,
      output: { signature: encodeBase64(Uint8Array.from({ length: 64 }, (_, index) => index + 1)) },
      walletAddress: learnerWallet,
    })
    throw new Error('Credential claim accepted without a valid receive signature.')
  } catch (error) {
    if (!(error instanceof Error) || !error.message.includes('Credential claim signature verification failed')) {
      throw error
    }
  }

  console.log(
    JSON.stringify(
      {
        claimMessageBytes: new TextEncoder().encode(claimChallenge.input.message).byteLength,
        credentialId: credential.id,
        demoCredentialId: demoCredential.id,
        siwsMessageBytes: message.byteLength,
        status: stored.status,
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
    rmSync(process.env.CREDENTIALMINT_DATA_DIR!, { force: true, recursive: true })
  })
