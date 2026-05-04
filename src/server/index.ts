import { serve } from '@hono/node-server'

import { createApi } from './api'

const port = Number(process.env.PORT ?? 3000)
serve({ fetch: createApi().fetch, port }, (info) => {
  console.log(`CredentialMint listening on http://localhost:${info.port}`)
})
