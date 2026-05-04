import { getEnv } from '../env'

export function getOperatorWallets(): string[] {
  return (getEnv('CREDENTIALMINT_OPERATOR_WALLETS') ?? '')
    .split(',')
    .map((wallet) => wallet.trim())
    .filter(Boolean)
}

export function isOperatorWallet(walletAddress: string): boolean {
  return getOperatorWallets().includes(walletAddress)
}
