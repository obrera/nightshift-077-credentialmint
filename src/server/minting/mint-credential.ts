import { fetchMaybeCollectionV1, getCreateV2Instruction } from '@obrera/mpl-core-kit-lib'
import {
  address,
  appendTransactionMessageInstructions,
  assertIsAddress,
  createSolanaRpc,
  createSolanaRpcSubscriptions,
  createTransactionMessage,
  devnet,
  generateKeyPairSigner,
  getSignatureFromTransaction,
  pipe,
  sendAndConfirmTransactionFactory,
  setTransactionMessageFeePayerSigner,
  setTransactionMessageLifetimeUsingBlockhash,
  signTransactionMessageWithSigners,
} from '@solana/kit'

import { getMintingConfig } from './config'

export async function mintCredential(args: { courseTitle: string; metadataUrl: string; walletAddress: string }) {
  try {
    assertIsAddress(args.walletAddress)
  } catch {
    throw new Error('Learner wallet must be a valid Solana address.')
  }

  const config = await getMintingConfig()
  const rpc = createSolanaRpc(devnet(config.rpcUrl))
  const rpcSubscriptions = createSolanaRpcSubscriptions(devnet(config.wsUrl))
  const collectionAddress = address(config.collectionAddress)
  const collection = await fetchMaybeCollectionV1(rpc, collectionAddress)
  if (!collection.exists) {
    throw new Error('Configured MPL Core credential collection address does not exist on devnet.')
  }

  const assetSigner = await generateKeyPairSigner()
  const latestBlockhash = (await rpc.getLatestBlockhash({ commitment: 'confirmed' }).send()).value
  const sendAndConfirmTransaction = sendAndConfirmTransactionFactory({ rpc, rpcSubscriptions })
  const message = pipe(
    createTransactionMessage({ version: 0 }),
    (current) => setTransactionMessageFeePayerSigner(config.signer, current),
    (current) => setTransactionMessageLifetimeUsingBlockhash(latestBlockhash, current),
    (current) =>
      appendTransactionMessageInstructions(
        [
          getCreateV2Instruction({
            asset: assetSigner,
            authority: config.signer,
            collection: collectionAddress,
            name: `Credential: ${args.courseTitle}`.slice(0, 32),
            owner: address(args.walletAddress),
            payer: config.signer,
            uri: args.metadataUrl,
          }),
        ],
        current,
      ),
  )
  const transaction = await signTransactionMessageWithSigners(message)
  await sendAndConfirmTransaction(transaction as Parameters<typeof sendAndConfirmTransaction>[0], {
    commitment: 'confirmed',
  })
  const signature = getSignatureFromTransaction(transaction as Parameters<typeof getSignatureFromTransaction>[0])
  return {
    assetAddress: assetSigner.address,
    collectionAddress: config.collectionAddress,
    explorerAssetUrl: explorerUrl('address', assetSigner.address),
    explorerTxUrl: explorerUrl('tx', signature),
    signature,
  }
}

function explorerUrl(kind: 'address' | 'tx', value: string): string {
  return `https://explorer.solana.com/${kind}/${value}?cluster=devnet`
}
