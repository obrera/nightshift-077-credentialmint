import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { type UiWallet, type UiWalletAccount, useSignIn } from '@wallet-ui/react'
import { createContext, type ReactNode, useContext, useMemo, useState } from 'react'
import { toast } from 'sonner'

import type { CredentialSession } from './credential-types'

import {
  claimCredential,
  createCredential,
  createNonce,
  fetchBootstrap,
  fetchCredentials,
  fetchSession,
  verifySignIn,
} from './credential-api'

interface CredentialMintContextValue {
  claimCredential: (credentialId: string) => Promise<void>
  createCredential: (payload: Parameters<typeof createCredential>[1]) => Promise<void>
  credentials: Awaited<ReturnType<typeof fetchCredentials>>['credentials']
  isLoadingCredentials: boolean
  session?: CredentialSession
  signIn: () => Promise<void>
  signOut: () => void
  status: Awaited<ReturnType<typeof fetchBootstrap>> | undefined
}

const CredentialMintContext = createContext<CredentialMintContextValue | undefined>(undefined)

export function CredentialMintProvider({
  account,
  children,
  wallet,
}: {
  account: UiWalletAccount
  children: ReactNode
  wallet: UiWallet
}) {
  const [token, setToken] = useState(() => localStorage.getItem('credentialmint.token') ?? '')
  const queryClient = useQueryClient()
  const signInWithWallet = useSignIn(wallet)
  const statusQuery = useQuery({ queryFn: fetchBootstrap, queryKey: ['credentialmint', 'bootstrap'] })
  const sessionQuery = useQuery({
    enabled: Boolean(token),
    queryFn: () => fetchSession(token),
    queryKey: ['credentialmint', 'session', token],
  })
  const session = sessionQuery.data?.walletAddress === account.address ? sessionQuery.data : undefined
  const credentialsQuery = useQuery({
    enabled: Boolean(session),
    queryFn: () => fetchCredentials(token, Boolean(session?.isOperator)),
    queryKey: ['credentialmint', 'credentials', token, session?.isOperator],
  })

  const { mutateAsync: signInAsync } = useMutation({
    mutationFn: async () => {
      const nonce = await createNonce(account.address)
      const output = await signInWithWallet(nonce.input)
      const signedMessage = output.signedMessage ? Buffer.from(output.signedMessage).toString('base64') : undefined
      const signature = Buffer.from(output.signature).toString('base64')
      const verified = await verifySignIn({ input: nonce.input, output: { signature, signedMessage } })
      localStorage.setItem('credentialmint.token', verified.token)
      setToken(verified.token)
      await queryClient.invalidateQueries({ queryKey: ['credentialmint'] })
    },
    onError: (error) =>
      toast.error('Sign-in failed', { description: error instanceof Error ? error.message : String(error) }),
    onSuccess: () => toast.success('Signed in with Solana'),
  })

  const { mutateAsync: createCredentialAsync } = useMutation({
    mutationFn: (payload: Parameters<typeof createCredential>[1]) => createCredential(token, payload),
    onError: (error) =>
      toast.error('Credential creation failed', {
        description: error instanceof Error ? error.message : String(error),
      }),
    onSuccess: async () => {
      toast.success('Credential approved for learner')
      await queryClient.invalidateQueries({ queryKey: ['credentialmint', 'credentials'] })
    },
  })

  const { mutateAsync: claimCredentialAsync } = useMutation({
    mutationFn: (credentialId: string) => claimCredential(token, credentialId),
    onError: (error) =>
      toast.error('Claim failed', { description: error instanceof Error ? error.message : String(error) }),
    onSuccess: async () => {
      toast.success('Credential NFT claimed')
      await queryClient.invalidateQueries({ queryKey: ['credentialmint', 'credentials'] })
    },
  })

  const value = useMemo<CredentialMintContextValue>(
    () => ({
      claimCredential: async (credentialId) => void (await claimCredentialAsync(credentialId)),
      createCredential: async (payload) => void (await createCredentialAsync(payload)),
      credentials: credentialsQuery.data?.credentials ?? [],
      isLoadingCredentials: credentialsQuery.isLoading,
      session,
      signIn: async () => void (await signInAsync()),
      signOut: () => {
        localStorage.removeItem('credentialmint.token')
        setToken('')
        queryClient.removeQueries({ queryKey: ['credentialmint', 'session'] })
      },
      status: statusQuery.data,
    }),
    [
      claimCredentialAsync,
      createCredentialAsync,
      credentialsQuery.data?.credentials,
      credentialsQuery.isLoading,
      queryClient,
      session,
      signInAsync,
      statusQuery.data,
    ],
  )

  return <CredentialMintContext.Provider value={value}>{children}</CredentialMintContext.Provider>
}

export function useCredentialMint() {
  const value = useContext(CredentialMintContext)
  if (!value) {
    throw new Error('useCredentialMint must be used inside CredentialMintProvider.')
  }
  return value
}
