import type { BootstrapStatus, CredentialRecord, CredentialSession } from './credential-types'

export async function claimCredential(token: string, credentialId: string) {
  return parseResponse<{ credential: CredentialRecord }>(
    await fetch(`/api/credentials/${credentialId}/claim`, { headers: authHeaders(token), method: 'POST' }),
  )
}

export async function createCredential(
  token: string,
  payload: {
    completionDate: string
    courseTitle: string
    credentialType: string
    evidenceUrl?: string
    grade?: string
    issuerName: string
    learnerName: string
    learnerWallet: string
    operatorNotes?: string
  },
) {
  return parseResponse<{ credential: CredentialRecord }>(
    await fetch('/api/credentials', {
      body: JSON.stringify(payload),
      headers: { ...authHeaders(token), 'content-type': 'application/json' },
      method: 'POST',
    }),
  )
}

export async function createDemoCredential(token: string) {
  return parseResponse<{ credential: CredentialRecord }>(
    await fetch('/api/demo/credentials', { headers: authHeaders(token), method: 'POST' }),
  )
}

export async function createNonce(walletAddress: string) {
  return parseResponse<{
    expiresAt: string
    input: { address: string; domain: string; nonce: string; statement: string; uri: string; version: string }
    nonce: string
  }>(
    await fetch('/api/auth/nonce', {
      body: JSON.stringify({ walletAddress }),
      headers: { 'content-type': 'application/json' },
      method: 'POST',
    }),
  )
}

export async function fetchBootstrap() {
  return parseResponse<BootstrapStatus>(await fetch('/api/bootstrap'))
}

export async function fetchCredentials(token: string, includeAll: boolean) {
  return parseResponse<{ credentials: CredentialRecord[] }>(
    await fetch(`/api/credentials${includeAll ? '?all=true' : ''}`, { headers: authHeaders(token) }),
  )
}

export async function fetchSession(token: string) {
  return parseResponse<CredentialSession>(await fetch('/api/session', { headers: authHeaders(token) }))
}

export async function verifySignIn(args: {
  input: { address: string; domain: string; nonce: string; statement: string; uri: string; version: string }
  output: { signature: string; signedMessage?: string }
}) {
  return parseResponse<Omit<CredentialSession, 'isOperator'>>(
    await fetch('/api/auth/verify', {
      body: JSON.stringify(args),
      headers: { 'content-type': 'application/json' },
      method: 'POST',
    }),
  )
}

function authHeaders(token: string) {
  return { authorization: `Bearer ${token}` }
}

async function parseResponse<T>(response: Response): Promise<T> {
  const body = (await response.json().catch(() => ({}))) as { error?: string } & T
  if (!response.ok) {
    throw new Error(body.error ?? `Request failed with ${response.status}`)
  }
  return body
}
