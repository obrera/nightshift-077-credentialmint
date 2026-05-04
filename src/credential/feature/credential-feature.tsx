import { SolanaUiWalletGuard } from '@/solana/ui/solana-ui-wallet-guard'

import { CredentialMintProvider } from '../data-access/use-credentialmint'
import { CredentialFeatureConnected } from './credential-feature-connected'

export function CredentialFeature() {
  return (
    <SolanaUiWalletGuard
      render={({ account, wallet }) => (
        <CredentialMintProvider account={account} wallet={wallet}>
          <CredentialFeatureConnected account={account} />
        </CredentialMintProvider>
      )}
    />
  )
}

export { CredentialFeature as Component }
