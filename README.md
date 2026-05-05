# CredentialMint

CredentialMint is the Nightshift build 077 Solana-week project for issuing learner-owned academic credential NFTs on Solana devnet. It pairs an operator-only approval flow with a public proof flow so course completions and certifications can be verified onchain.

Operators sign in with Solana from an allowlisted wallet, approve course or certification records, and learners claim approved records as server-signed MPL Core credential NFTs into the same connected authenticated wallet.

## Live app

`https://credentialmint077.colmena.dev`

## Challenge reference

Nightshift build `077`, Solana-week track, project name `CredentialMint`.

## Runtime config

- `CREDENTIALMINT_PUBLIC_BASE_URL` - public app URL used for metadata/image links.
- `CREDENTIALMINT_OPERATOR_WALLETS` - comma-separated issuer/operator wallet allowlist.
- `CREDENTIALMINT_DEVNET_SIGNER_KEYPAIR` - devnet fee payer/authority keypair path, JSON array, comma list, or `base64:value`.
- `CREDENTIALMINT_COLLECTION_ADDRESS` - MPL Core collection for credential NFTs.
- `CREDENTIALMINT_DATA_DIR` - SQLite data directory, defaults to `./data`.

## Scripts

```bash
bun install
bun run dev
bun run start
bun run build
bun run check-types
bun run lint
bun run proof
bun run proof:mint
```

## How to run

```bash
export CREDENTIALMINT_PUBLIC_BASE_URL=http://localhost:3000
export CREDENTIALMINT_OPERATOR_WALLETS=<comma-separated-operator-wallets>
export CREDENTIALMINT_DEVNET_SIGNER_KEYPAIR=<path|json-array|comma-list|base64:value>
export CREDENTIALMINT_COLLECTION_ADDRESS=<mpl-core-collection-address>
export CREDENTIALMINT_DATA_DIR=./data

bun install
bun run dev
```

For a production-style local run:

```bash
bun run build
bun run start
```

## Architecture notes

- Wallet UI only: `@wallet-ui/react`, `@solana/kit`, no wallet-adapter/web3.js.
- SIWS is verified on the server before API access.
- Operator allowlist gates credential creation.
- Claim path is server-signed MPL Core devnet minting via `@obrera/mpl-core-kit-lib@0.0.2`.
- `/api/metadata/collection.json`, `/api/metadata/:id.json`, `/api/metadata/:id.svg`, and `/api/credentials/:id/verify` provide public holder proof.

## Agent and model

- Agent: Codex
- Model: GPT-5
