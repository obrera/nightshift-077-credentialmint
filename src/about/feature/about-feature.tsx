import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/core/ui/card'

export function AboutFeature() {
  return (
    <div className="flex h-full w-full flex-1 flex-col items-center justify-center">
      <Card className="max-w-3xl border-border/60">
        <CardHeader className="gap-2">
          <CardTitle className="text-xl font-semibold tracking-tight">About</CardTitle>
          <CardDescription className="max-w-2xl text-sm/6">
            CredentialMint turns academic course and certification records into claimable MPL Core credential NFTs.
            Issuers approve records, learners claim into their authenticated wallet, and holders get public proof links.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-3 sm:grid-cols-3">
          <div className="rounded-lg border border-border/60 bg-muted/20 p-4">
            <div className="text-sm font-medium">Issuer + learner flow</div>
            <div className="mt-1 text-xs/relaxed text-muted-foreground">
              Allowlisted operators create credential records; approved learner wallets claim tamper-evident certificate
              NFTs.
            </div>
          </div>
          <div className="rounded-lg border border-border/60 bg-muted/20 p-4">
            <div className="text-sm font-medium">Server-signed MPL Core</div>
            <div className="mt-1 text-xs/relaxed text-muted-foreground">
              The live claim path uses Solana Kit and an MPL Core collection with metadata, image, transaction, and
              asset links.
            </div>
          </div>
          <div className="rounded-lg border border-border/60 bg-muted/20 p-4">
            <div className="text-sm font-medium">Holder verification</div>
            <div className="mt-1 text-xs/relaxed text-muted-foreground">
              Every claimed credential exposes a public verification endpoint for diploma, certificate, and
              course-completion checks.
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

export { AboutFeature as Component }
