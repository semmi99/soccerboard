import { useState, type FormEvent } from 'react'
import { Button } from '../../../components/ui/Button'
import { sendContactMessage } from '../../../lib/supabase/contact'
import { LegalPageLayout } from './LegalPageLayout'

const inputClass =
  'w-full rounded-md border border-white/15 bg-white/5 px-3 py-2 text-sm text-white outline-none focus:border-violet-accent'

export function KontaktPage() {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [message, setMessage] = useState('')
  const [isSending, setIsSending] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [sent, setSent] = useState(false)

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setError(null)
    setIsSending(true)
    try {
      await sendContactMessage({ name, email, message })
      setSent(true)
      setName('')
      setEmail('')
      setMessage('')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Nachricht konnte nicht gesendet werden.')
    } finally {
      setIsSending(false)
    }
  }

  return (
    <LegalPageLayout title="Kontakt">
      <p>
        Fragen zu TacticBoard Pro, 9011 Soccer oder Soccer Analytics Pro? Schreib uns — wir
        melden uns so schnell wie möglich zurück.
      </p>
      <p className="text-white/60">
        Du erreichst uns auch direkt unter{' '}
        <a href="mailto:office@9011soccer.com" className="text-brand-gold underline">
          office@9011soccer.com
        </a>
        .
      </p>

      {sent ? (
        <p className="rounded-lg border border-green-500/30 bg-green-500/10 px-4 py-3 text-green-300">
          Danke für deine Nachricht! Wir melden uns bald bei dir.
        </p>
      ) : (
        <form className="flex flex-col gap-4" onSubmit={(e) => void handleSubmit(e)}>
          <label className="flex flex-col gap-1.5 text-sm">
            <span className="font-medium text-white/70">Name</span>
            <input
              type="text"
              required
              className={inputClass}
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </label>
          <label className="flex flex-col gap-1.5 text-sm">
            <span className="font-medium text-white/70">E-Mail</span>
            <input
              type="email"
              required
              className={inputClass}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </label>
          <label className="flex flex-col gap-1.5 text-sm">
            <span className="font-medium text-white/70">Nachricht</span>
            <textarea
              required
              rows={5}
              className={inputClass}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
            />
          </label>
          {error && <p className="text-sm text-red-400">{error}</p>}
          <Button type="submit" variant="brand" loading={isSending} className="self-start">
            Nachricht senden
          </Button>
        </form>
      )}
    </LegalPageLayout>
  )
}
