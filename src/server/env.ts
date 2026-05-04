export function getDataDir(): string {
  return getEnv('CREDENTIALMINT_DATA_DIR') ?? './data'
}

export function getEnv(name: string): string | undefined {
  const value = process.env[name]
  return value && value.trim().length > 0 ? value.trim() : undefined
}

export function getPublicBaseUrl(): string {
  return getEnv('CREDENTIALMINT_PUBLIC_BASE_URL') ?? `http://localhost:${process.env.PORT ?? '3000'}`
}
