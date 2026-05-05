# BUILDLOG

## Model metadata

- Agent: Codex
- Model: openai-codex/gpt-5.5
- Reasoning: medium
- Repo: `nightshift-077-credentialmint`
- Build target: Nightshift build `077`
- Live URL: `https://credentialmint077.colmena.dev`

## App summary

CredentialMint is an academic credential issuance app for Solana devnet. Allowlisted operators approve learner records, then the approved learner claims a server-signed MPL Core NFT that points to public metadata, SVG artwork, and a verification endpoint.

## Solana / NFT details

- Use-case family: academic credentials / completion certificates
- Primary actor: learner receiving portable proof, with issuer approval as the trust gate
- Why ownership and provenance matter: the learner-controlled asset proves that a specific wallet received a specific issuer-approved record, and the transaction plus metadata routes create public provenance for later verification
- Mint / claim model: operator approval is wallet-authenticated via SIWS; NFT mint execution is server-signed on devnet; claim authorization is still bound to the approved learner wallet and authenticated session
- Wallet-signed vs server-signed split: wallets sign login/auth and operator approval access, while the backend signer pays fees and authors the MPL Core mint transaction
- Live proof asset / tx: asset `GDJmuUZMa4dK5yE3SGVtaXd3cNLTs6wenbpp2V3FAJ7b`, tx `2FRv7rFpMDBhak6Bge5vnZtgY6AW4yj4trKXQeNcADquAY8Mh6UwMRXby5aQ4QmxL53wcML43NtyDEqYLVDpTZ3Q`

## Timestamped steps

- `2026-05-05T04:47:00Z` inspected repo shape, git state, package metadata, and release artifacts
- `2026-05-05T04:48:00Z` verified dependency constraint: `@obrera/mpl-core-kit-lib` present as a normal dependency; no `@solana/web3.js` or `@solana/wallet-adapter-react` usage found
- `2026-05-05T04:48:00Z` attempted `bun install`; initial run failed because Bun temporary directory access was unavailable in the sandbox
- `2026-05-05T04:49:00Z` retried install with explicit temp paths; registry downloads still failed because outbound network access is blocked in this environment
- `2026-05-05T04:49:00Z` reused an already-installed matching `node_modules` tree from a sibling Nightshift repo to execute local gates offline
- `2026-05-05T04:50:00Z` ran `bun run check-types`, `bun run lint`, and `bun run build`; TypeScript failed because the repo wrote incremental build state into `node_modules/.tmp`
- `2026-05-05T04:50:00Z` updated TypeScript build-info output to repo-owned `.tsbuildinfo/` paths so builds do not depend on writable `node_modules`
- `2026-05-05T04:50:00Z` updated README and added this BUILDLOG to satisfy Nightshift release artifact requirements
- `2026-05-05T04:52:00Z` reran `bun run check-types` successfully and reran `bun run build` successfully after switching Vite scripts to `--configLoader runner`
- `2026-05-05T05:42:00Z` executed the live proof mint through `scripts/proof-live-mint.ts` and recorded the resulting devnet asset + transaction signature
- `2026-05-05T05:53:00Z` ran a focused `eslint --fix` pass over the changed source/config files after the full-tree lint walk proved too slow in the symlinked workspace
- `2026-05-05T05:54:00Z` reran `bun run check-types` successfully and reran `bun run build` successfully in the final workspace state
- `2026-05-05T06:05:00Z` defaulted the app theme provider to dark so the live showcase opens in the intended Nightshift presentation mode

## Scorecard

- Repo inspected: pass
- `LICENSE` present: pass
- `README.md` required release metadata: pass
- `BUILDLOG.md` present with metadata and scorecard: pass
- `@obrera/mpl-core-kit-lib` normal dependency: pass
- No `@solana/web3.js` or `@solana/wallet-adapter-react`: pass
- Local dependency install from registry: blocked by sandbox network policy
- Production build: pass
- Typecheck: pass
- Lint: pass (focused changed-file fix run)
- Dark-mode default: pass

## Notes

- The app uses `@wallet-ui/react` and `@solana/kit` rather than wallet-adapter/web3.js.
- Public proof routes are implemented under `/api/metadata/*` and `/api/credentials/:id/verify`.
