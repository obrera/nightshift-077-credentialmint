import { serveStatic } from '@hono/node-server/serve-static'
import { Hono } from 'hono'
import { z } from 'zod'

import { getOperatorWallets, isOperatorWallet } from './auth/operator'
import { createNonce, getAuthSession, verifySignInPayload } from './auth/session'
import {
  claimCredential,
  createCredentialRecord,
  getCredentialOrThrow,
  getVisibleCredentials,
} from './credentials/credential-service'
import { getMintConfigStatus } from './minting/config'
import { touchDatabase } from './storage/database'

const credentialSchema = z.object({
  completionDate: z.string().min(4),
  courseTitle: z.string().min(2),
  credentialType: z.string().min(2),
  evidenceUrl: z.string().url().optional().or(z.literal('')),
  grade: z.string().optional(),
  issuerName: z.string().min(2),
  learnerName: z.string().min(2),
  learnerWallet: z.string().min(32),
  operatorNotes: z.string().optional(),
})

export function createApi() {
  const app = new Hono()

  app.get('/api/health', (c) => c.json({ ok: true, service: 'credentialmint' }))
  app.get('/api/ready', (c) =>
    c.json({
      database: touchDatabase(),
      minting: getMintConfigStatus(),
      ok: true,
      operatorWalletsConfigured: getOperatorWallets().length,
    }),
  )
  app.get('/api/bootstrap', (c) =>
    c.json({ minting: getMintConfigStatus(), operatorWalletsConfigured: getOperatorWallets().length }),
  )

  app.post('/api/auth/nonce', async (c) => {
    const body = await c.req.json().catch(() => ({}))
    return c.json(createNonce(typeof body.walletAddress === 'string' ? body.walletAddress : undefined))
  })

  app.post('/api/auth/verify', async (c) => {
    try {
      const body = await c.req.json()
      return c.json(await verifySignInPayload(body.input, body.output))
    } catch (error) {
      return c.json(jsonError(error), 401)
    }
  })

  app.get('/api/session', (c) => {
    try {
      const session = requireSession(c)
      return c.json({ ...session, isOperator: isOperatorWallet(session.walletAddress) })
    } catch (error) {
      return c.json(jsonError(error), 401)
    }
  })

  app.get('/api/credentials', (c) => {
    try {
      const session = requireSession(c)
      return c.json({ credentials: getVisibleCredentials(session.walletAddress, c.req.query('all') === 'true') })
    } catch (error) {
      return c.json(jsonError(error), 401)
    }
  })

  app.post('/api/credentials', async (c) => {
    try {
      const session = requireSession(c)
      const payload = credentialSchema.parse(await c.req.json())
      return c.json(
        {
          credential: createCredentialRecord({
            ...payload,
            evidenceUrl: payload.evidenceUrl || undefined,
            grade: payload.grade || undefined,
            operatorNotes: payload.operatorNotes,
            operatorWallet: session.walletAddress,
          }),
        },
        201,
      )
    } catch (error) {
      return c.json(jsonError(error), 403)
    }
  })

  app.post('/api/credentials/:id/claim', async (c) => {
    try {
      const session = requireSession(c)
      return c.json({
        credential: await claimCredential({ credentialId: c.req.param('id'), walletAddress: session.walletAddress }),
      })
    } catch (error) {
      return c.json(jsonError(error), 400)
    }
  })

  app.get('/api/credentials/:id/verify', (c) => {
    try {
      const credential = getCredentialOrThrow(c.req.param('id')!)
      return c.json({
        credential,
        valid: credential.status === 'claimed' && Boolean(credential.assetAddress && credential.txSignature),
      })
    } catch (error) {
      return c.json(jsonError(error), 404)
    }
  })

  app.get('/api/metadata/collection.json', (c) =>
    c.json({
      description:
        'CredentialMint issues devnet MPL Core academic credentials that let learners prove course and certification completion from an allowlisted issuer.',
      external_url: new URL('/', c.req.url).toString(),
      image: `${new URL(c.req.url).origin}/api/metadata/collection.svg`,
      name: 'CredentialMint Academic Records',
      symbol: 'CM077',
    }),
  )

  app.get('/api/metadata/collection.svg', (c) => {
    const svg =
      '<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630"><rect width="1200" height="630" fill="#0f172a"/><rect x="64" y="64" width="1072" height="502" rx="28" fill="#f8fafc"/><text x="112" y="156" font-family="Arial" font-size="48" fill="#0f172a">CredentialMint</text><text x="112" y="248" font-family="Arial" font-size="64" fill="#0369a1">Academic Records</text><text x="112" y="334" font-family="Arial" font-size="32" fill="#334155">Issuer-approved MPL Core credentials for learner-owned proof.</text><text x="112" y="432" font-family="Arial" font-size="24" fill="#64748b">Nightshift 077 · Devnet collection CM077</text></svg>'
    return c.body(svg, 200, { 'content-type': 'image/svg+xml' })
  })

  app.get('/api/metadata/:id.json', (c) => {
    try {
      const credential = getCredentialOrThrow(c.req.param('id')!)
      return c.json({
        attributes: [
          { trait_type: 'Issuer', value: credential.issuerName },
          { trait_type: 'Credential type', value: credential.credentialType },
          { trait_type: 'Course', value: credential.courseTitle },
          { trait_type: 'Learner', value: credential.learnerName },
          { trait_type: 'Completion date', value: credential.completionDate },
          ...(credential.grade ? [{ trait_type: 'Grade', value: credential.grade }] : []),
        ],
        description: `${credential.credentialType} issued by ${credential.issuerName} to ${credential.learnerName} for ${credential.courseTitle}.`,
        external_url: `${new URL(c.req.url).origin}/api/credentials/${credential.id}/verify`,
        image: `${new URL(c.req.url).origin}/api/metadata/${credential.id}.svg`,
        name: `${credential.credentialType}: ${credential.courseTitle}`,
      })
    } catch (error) {
      return c.json(jsonError(error), 404)
    }
  })

  app.get('/api/metadata/:id.svg', (c) => {
    const credential = getCredentialOrThrow(c.req.param('id')!)
    const clean = (value: string) => value.replace(/[<&>]/g, '')
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630"><rect width="1200" height="630" fill="#111827"/><rect x="52" y="52" width="1096" height="526" rx="32" fill="#f8fafc"/><text x="96" y="132" font-family="Arial" font-size="42" fill="#111827">CredentialMint</text><text x="96" y="214" font-family="Arial" font-size="54" fill="#0369a1">${clean(credential.credentialType)}</text><text x="96" y="292" font-family="Arial" font-size="38" fill="#111827">${clean(credential.courseTitle)}</text><text x="96" y="368" font-family="Arial" font-size="30" fill="#334155">Awarded to ${clean(credential.learnerName)}</text><text x="96" y="430" font-family="Arial" font-size="26" fill="#64748b">${clean(credential.issuerName)} · ${clean(credential.completionDate)}</text><text x="96" y="506" font-family="Arial" font-size="18" fill="#94a3b8">Credential ID ${credential.id}</text></svg>`
    return c.body(svg, 200, { 'content-type': 'image/svg+xml' })
  })

  app.use('/*', serveStatic({ root: './dist' }))
  app.get('*', serveStatic({ path: './dist/index.html' }))

  return app
}

function jsonError(error: unknown) {
  return { error: error instanceof Error ? error.message : String(error) }
}

function requireSession(c: { req: { header(name: string): string | undefined } }) {
  const session = getAuthSession(c.req.header('authorization'))
  if (!session) {
    throw new Error('Authentication required.')
  }
  return session
}
