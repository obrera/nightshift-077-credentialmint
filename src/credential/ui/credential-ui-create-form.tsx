import { useState } from 'react'

import { Button } from '@/core/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/core/ui/card'
import { Input } from '@/core/ui/input'
import { Label } from '@/core/ui/label'
import { Textarea } from '@/core/ui/textarea'

import { useCredentialMint } from '../data-access/use-credentialmint'

export function CredentialUiCreateForm() {
  const { createCredential } = useCredentialMint()
  const [form, setForm] = useState({
    completionDate: new Date().toISOString().slice(0, 10),
    courseTitle: 'Applied Solana Credentialing',
    credentialType: 'Certificate of Completion',
    evidenceUrl: '',
    grade: '',
    issuerName: 'CredentialMint Academy',
    learnerName: '',
    learnerWallet: '',
    operatorNotes: '',
  })

  function update(field: keyof typeof form, value: string) {
    setForm((current) => ({ ...current, [field]: value }))
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Approve a credential</CardTitle>
        <CardDescription>Create the issuer record that a learner can claim as an MPL Core NFT.</CardDescription>
      </CardHeader>
      <CardContent>
        <form
          className="grid gap-4 md:grid-cols-2"
          onSubmit={async (event) => {
            event.preventDefault()
            await createCredential(form)
          }}
        >
          <Field label="Learner name">
            <Input onChange={(event) => update('learnerName', event.target.value)} required value={form.learnerName} />
          </Field>
          <Field label="Learner wallet">
            <Input
              onChange={(event) => update('learnerWallet', event.target.value)}
              required
              value={form.learnerWallet}
            />
          </Field>
          <Field label="Course / certification">
            <Input onChange={(event) => update('courseTitle', event.target.value)} required value={form.courseTitle} />
          </Field>
          <Field label="Credential type">
            <Input
              onChange={(event) => update('credentialType', event.target.value)}
              required
              value={form.credentialType}
            />
          </Field>
          <Field label="Issuer">
            <Input onChange={(event) => update('issuerName', event.target.value)} required value={form.issuerName} />
          </Field>
          <Field label="Completion date">
            <Input
              onChange={(event) => update('completionDate', event.target.value)}
              required
              type="date"
              value={form.completionDate}
            />
          </Field>
          <Field label="Grade / score">
            <Input onChange={(event) => update('grade', event.target.value)} value={form.grade} />
          </Field>
          <Field label="Evidence URL">
            <Input onChange={(event) => update('evidenceUrl', event.target.value)} value={form.evidenceUrl} />
          </Field>
          <div className="md:col-span-2">
            <Field label="Operator notes">
              <Textarea onChange={(event) => update('operatorNotes', event.target.value)} value={form.operatorNotes} />
            </Field>
          </div>
          <div className="md:col-span-2">
            <Button type="submit">Approve credential</Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}

function Field({ children, label }: { children: React.ReactNode; label: string }) {
  return (
    <Label className="grid gap-2 text-sm font-medium">
      {label}
      {children}
    </Label>
  )
}
