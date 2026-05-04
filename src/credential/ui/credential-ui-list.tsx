import { Badge } from '@/core/ui/badge'
import { Button } from '@/core/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/core/ui/card'
import { SolanaUiAddress } from '@/solana/ui/solana-ui-address'

import type { CredentialRecord, CredentialSession } from '../data-access/credential-types'

import { useCredentialMint } from '../data-access/use-credentialmint'

export function CredentialUiList({
  credentials,
  isLoading,
  session,
}: {
  credentials: CredentialRecord[]
  isLoading: boolean
  session?: CredentialSession
}) {
  const { claimCredential, signIn } = useCredentialMint()

  return (
    <Card>
      <CardHeader>
        <CardTitle>{session?.isOperator ? 'All credential records' : 'My credentials'}</CardTitle>
        <CardDescription>Approved credentials become claimable NFTs for the listed learner wallet.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {!session ? <Button onClick={signIn}>Sign in to view credentials</Button> : null}
        {isLoading ? <p className="text-sm text-muted-foreground">Loading credentials…</p> : null}
        {session && credentials.length === 0 ? (
          <p className="text-sm text-muted-foreground">No credentials yet.</p>
        ) : null}
        {credentials.map((credential) => {
          const canClaim = session?.walletAddress === credential.learnerWallet && credential.status === 'approved'
          return (
            <div className="rounded-lg border p-4" key={credential.id}>
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div className="space-y-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="font-semibold">{credential.courseTitle}</h3>
                    <Badge>{credential.status}</Badge>
                    <Badge variant="secondary">{credential.credentialType}</Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {credential.issuerName} awarded to {credential.learnerName} on {credential.completionDate}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Learner <SolanaUiAddress address={credential.learnerWallet} len={8} />
                  </p>
                </div>
                {canClaim ? <Button onClick={() => claimCredential(credential.id)}>Claim credential NFT</Button> : null}
              </div>
              {credential.assetAddress ? (
                <div className="mt-3 flex flex-wrap gap-3 text-sm">
                  <a
                    className="text-sky-600 underline"
                    href={credential.explorerAssetUrl}
                    rel="noreferrer"
                    target="_blank"
                  >
                    Asset
                  </a>
                  <a
                    className="text-sky-600 underline"
                    href={credential.explorerTxUrl}
                    rel="noreferrer"
                    target="_blank"
                  >
                    Transaction
                  </a>
                  <a
                    className="text-sky-600 underline"
                    href={`/api/credentials/${credential.id}/verify`}
                    rel="noreferrer"
                    target="_blank"
                  >
                    Verify
                  </a>
                  <a className="text-sky-600 underline" href={credential.metadataUrl} rel="noreferrer" target="_blank">
                    Metadata
                  </a>
                </div>
              ) : null}
            </div>
          )
        })}
      </CardContent>
    </Card>
  )
}
