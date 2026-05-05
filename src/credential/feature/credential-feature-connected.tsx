import type { UiWalletAccount } from '@wallet-ui/react'

import { Badge } from '@/core/ui/badge'
import { Button } from '@/core/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/core/ui/card'
import { SolanaUiAddress } from '@/solana/ui/solana-ui-address'

import { useCredentialMint } from '../data-access/use-credentialmint'
import { CredentialUiCreateForm } from '../ui/credential-ui-create-form'
import { CredentialUiList } from '../ui/credential-ui-list'

export function CredentialFeatureConnected({ account }: { account: UiWalletAccount }) {
  const { credentials, isLoadingCredentials, session, signIn, signOut, status } = useCredentialMint()

  return (
    <div className="mx-auto w-full max-w-6xl space-y-6 px-4 py-8">
      <section className="grid gap-4 lg:grid-cols-[1.3fr_0.7fr]">
        <Card className="overflow-hidden border-sky-200 bg-gradient-to-br from-sky-50 to-white dark:border-sky-950 dark:from-sky-950/40 dark:to-background">
          <CardHeader>
            <Badge className="w-fit" variant="secondary">
              Academic credentials
            </Badge>
            <CardTitle className="text-4xl">CredentialMint</CardTitle>
            <CardDescription className="max-w-2xl text-base">
              Operators approve course and certification records. Learners claim a server-signed MPL Core credential NFT
              into the same SIWS-authenticated wallet. Visitors can request a devnet demo credential after signing in,
              then claim and verify the minted proof.
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-3 text-sm text-muted-foreground sm:grid-cols-3">
            <div>
              <strong className="block text-foreground">Issuer approval</strong>Allowlisted wallets create
              tamper-evident records.
            </div>
            <div>
              <strong className="block text-foreground">Learner claim</strong>The approved holder wallet mints the
              credential.
            </div>
            <div>
              <strong className="block text-foreground">Public proof</strong>Metadata, image, and verify endpoints back
              every NFT.
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Runtime</CardTitle>
            <CardDescription>Wallet auth and mint readiness</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <div className="flex items-center justify-between gap-2">
              <span>Wallet</span>
              <code>
                <SolanaUiAddress address={account.address} />
              </code>
            </div>
            <div className="flex items-center justify-between gap-2">
              <span>SIWS</span>
              <Badge variant={session ? 'default' : 'secondary'}>{session ? 'signed in' : 'required'}</Badge>
            </div>
            <div className="flex items-center justify-between gap-2">
              <span>Operator</span>
              <Badge variant={session?.isOperator ? 'default' : 'outline'}>
                {session?.isOperator ? 'allowlisted' : 'learner'}
              </Badge>
            </div>
            <div className="flex items-center justify-between gap-2">
              <span>Mint path</span>
              <Badge variant={status?.minting.ready ? 'default' : 'destructive'}>
                {status?.minting.status ?? 'checking'}
              </Badge>
            </div>
            <div className="flex items-center justify-between gap-2">
              <span>Visitor demo</span>
              <Badge variant={session && !session.isOperator ? 'default' : 'secondary'}>
                {session && !session.isOperator ? 'claimable after request' : 'sign in as learner'}
              </Badge>
            </div>
            {session ? (
              <Button className="w-full" onClick={signOut} variant="outline">
                Sign out
              </Button>
            ) : (
              <Button className="w-full" onClick={signIn}>
                Sign in with Solana
              </Button>
            )}
          </CardContent>
        </Card>
      </section>
      {session?.isOperator ? <CredentialUiCreateForm /> : null}
      <CredentialUiList credentials={credentials} isLoading={isLoadingCredentials} session={session} />
    </div>
  )
}
