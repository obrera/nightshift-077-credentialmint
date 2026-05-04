import Database from 'better-sqlite3'
import { mkdirSync } from 'node:fs'
import { join } from 'node:path'

import type { CredentialRecord, NonceRecord, SessionRecord } from './types'

import { getDataDir } from '../env'

let database: Database.Database | undefined

export function consumeNonce(nonce: string): NonceRecord | undefined {
  const db = getDatabase()
  const row = db.prepare('select * from nonces where nonce = ?').get(nonce) as Record<string, unknown> | undefined
  if (!row) {
    return undefined
  }
  db.prepare('delete from nonces where nonce = ?').run(nonce)
  return {
    expiresAt: row.expires_at as string,
    issuedAt: row.issued_at as string,
    nonce: row.nonce as string,
    walletAddress: row.wallet_address as string | undefined,
  }
}

export function createCredential(record: CredentialRecord): CredentialRecord {
  getDatabase()
    .prepare(
      `insert into credentials (
      id, created_at, updated_at, learner_wallet, learner_name, course_title, issuer_name, credential_type,
      completion_date, grade, evidence_url, status, operator_wallet
    ) values (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    )
    .run(
      record.id,
      record.createdAt,
      record.updatedAt,
      record.learnerWallet,
      record.learnerName,
      record.courseTitle,
      record.issuerName,
      record.credentialType,
      record.completionDate,
      record.grade,
      record.evidenceUrl,
      record.status,
      record.operatorWallet,
    )
  return record
}

export function getCredential(id: string): CredentialRecord | undefined {
  const row = getDatabase().prepare('select * from credentials where id = ?').get(id)
  return row ? mapCredential(row as Record<string, unknown>) : undefined
}

export function getSession(token: string): SessionRecord | undefined {
  const row = getDatabase().prepare('select * from sessions where token = ?').get(token) as
    | Record<string, unknown>
    | undefined
  if (!row) {
    return undefined
  }
  return {
    createdAt: row.created_at as string,
    expiresAt: row.expires_at as string,
    token: row.token as string,
    walletAddress: row.wallet_address as string,
  }
}

export function listCredentials(learnerWallet?: string): CredentialRecord[] {
  const db = getDatabase()
  const rows = learnerWallet
    ? db.prepare('select * from credentials where learner_wallet = ? order by created_at desc').all(learnerWallet)
    : db.prepare('select * from credentials order by created_at desc').all()
  return rows.map((row) => mapCredential(row as Record<string, unknown>))
}

export function saveCredential(record: CredentialRecord): CredentialRecord {
  getDatabase()
    .prepare(
      `update credentials set
      updated_at = ?, status = ?, operator_wallet = ?, operator_notes = ?, approved_at = ?, asset_address = ?,
      tx_signature = ?, collection_address = ?, metadata_url = ?, image_url = ?, explorer_asset_url = ?, explorer_tx_url = ?
      where id = ?`,
    )
    .run(
      record.updatedAt,
      record.status,
      record.operatorWallet,
      record.operatorNotes,
      record.approvedAt,
      record.assetAddress,
      record.txSignature,
      record.collectionAddress,
      record.metadataUrl,
      record.imageUrl,
      record.explorerAssetUrl,
      record.explorerTxUrl,
      record.id,
    )
  return record
}

export function saveNonce(record: NonceRecord): NonceRecord {
  getDatabase()
    .prepare('insert into nonces (nonce, wallet_address, issued_at, expires_at) values (?, ?, ?, ?)')
    .run(record.nonce, record.walletAddress, record.issuedAt, record.expiresAt)
  return record
}

export function saveSession(record: SessionRecord): SessionRecord {
  getDatabase()
    .prepare('insert into sessions (token, wallet_address, created_at, expires_at) values (?, ?, ?, ?)')
    .run(record.token, record.walletAddress, record.createdAt, record.expiresAt)
  return record
}

export function touchDatabase(): boolean {
  getDatabase().prepare('select 1').get()
  return true
}

function getDatabase(): Database.Database {
  if (database) {
    return database
  }

  mkdirSync(getDataDir(), { recursive: true })
  database = new Database(join(getDataDir(), 'credentialmint.sqlite'))
  database.pragma('journal_mode = WAL')
  database.exec(`
    create table if not exists credentials (
      id text primary key,
      created_at text not null,
      updated_at text not null,
      learner_wallet text not null,
      learner_name text not null,
      course_title text not null,
      issuer_name text not null,
      credential_type text not null,
      completion_date text not null,
      grade text,
      evidence_url text,
      status text not null,
      operator_wallet text,
      operator_notes text,
      approved_at text,
      asset_address text,
      tx_signature text,
      collection_address text,
      metadata_url text,
      image_url text,
      explorer_asset_url text,
      explorer_tx_url text
    );
    create table if not exists sessions (
      token text primary key,
      wallet_address text not null,
      created_at text not null,
      expires_at text not null
    );
    create table if not exists nonces (
      nonce text primary key,
      wallet_address text,
      issued_at text not null,
      expires_at text not null
    );
  `)
  return database
}

function mapCredential(row: Record<string, unknown>): CredentialRecord {
  return {
    approvedAt: row.approved_at as string | undefined,
    assetAddress: row.asset_address as string | undefined,
    collectionAddress: row.collection_address as string | undefined,
    completionDate: row.completion_date as string,
    courseTitle: row.course_title as string,
    createdAt: row.created_at as string,
    credentialType: row.credential_type as string,
    evidenceUrl: row.evidence_url as string | undefined,
    explorerAssetUrl: row.explorer_asset_url as string | undefined,
    explorerTxUrl: row.explorer_tx_url as string | undefined,
    grade: row.grade as string | undefined,
    id: row.id as string,
    imageUrl: row.image_url as string | undefined,
    issuerName: row.issuer_name as string,
    learnerName: row.learner_name as string,
    learnerWallet: row.learner_wallet as string,
    metadataUrl: row.metadata_url as string | undefined,
    operatorNotes: row.operator_notes as string | undefined,
    operatorWallet: row.operator_wallet as string | undefined,
    status: row.status as CredentialRecord['status'],
    txSignature: row.tx_signature as string | undefined,
    updatedAt: row.updated_at as string,
  }
}
