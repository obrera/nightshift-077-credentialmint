# CredentialMint

Nightshift 077: an academic credential NFT app built from `create-seed` + `bun-react-vite-solana-kit`.

Operators sign in with Solana from an allowlisted wallet, approve course/certification records, and learners claim approved records as server-signed MPL Core credential NFTs into the same connected authenticated wallet.

## Runtime config

- `CREDENTIALMINT_PUBLIC_BASE_URL` - public app URL used for metadata/image links.
- `CREDENTIALMINT_OPERATOR_WALLETS` - comma-separated issuer/operator wallet allowlist.
- `CREDENTIALMINT_DEVNET_SIGNER_KEYPAIR` - devnet fee payer/authority keypair path, JSON array, comma list, or `base64:value`.
- `CREDENTIALMINT_COLLECTION_ADDRESS` - MPL Core collection for credential NFTs.
- `CREDENTIALMINT_DATA_DIR` - SQLite data directory, defaults to `./data`.

## Scripts

```bash
bun run dev
bun run start
bun run build
bun run proof
bun run proof:mint
```

## Architecture notes

- Wallet UI only: `@wallet-ui/react`, `@solana/kit`, no wallet-adapter/web3.js.
- SIWS is verified on the server before API access.
- Operator allowlist gates credential creation.
- Claim path is server-signed MPL Core devnet minting via `@obrera/mpl-core-kit-lib@0.0.2`.
- `/api/metadata/collection.json`, `/api/metadata/:id.json`, `/api/metadata/:id.svg`, and `/api/credentials/:id/verify` provide public holder proof.
