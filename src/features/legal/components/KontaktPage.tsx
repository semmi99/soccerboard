import { useState, type FormEvent } from 'react'
import { useTranslation } from 'react-i18next'
import { Button } from '../../../components/ui/Button'
import { sendContactMessage } from '../../../lib/supabase/contact'
import { LegalPageLayout } from './LegalPageLayout'

const inputClass =
  'w-full rounded-md border border-white/15 bg-white/5 px-3 py-2 text-sm text-white outline-none focus:border-violet-accent'

export function KontaktPage() {
  const { t } = useTranslation('legal')
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
      setError(err instanceof Error ? err.message : t('kontakt.sendError'))
    } finally {
      setIsSending(false)
    }
  }

  return (
    <LegalPageLayout title={t('kontakt.title')}>
      <p>{t('kontakt.intro')}</p>
      <p className="text-white/60">
        {t('kontakt.reachDirectlyBefore')}{' '}
        <a href="mailto:office@9011soccer.com" className="text-brand-gold underline">
          office@9011soccer.com
        </a>
        .
      </p>

      {sent ? (
        <p className="rounded-lg border border-green-500/30 bg-green-500/10 px-4 py-3 text-green-300">
          {t('kontakt.sentMessage')}
        </p>
      ) : (
        <form className="flex flex-col gap-4" onSubmit={(e) => void handleSubmit(e)}>
          <label className="flex flex-col gap-1.5 text-sm">
            <span className="font-medium text-white/70">{t('kontakt.nameLabel')}</span>
            <input
              type="text"
              required
              className={inputClass}
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </label>
          <label className="flex flex-col gap-1.5 text-sm">
            <span className="font-medium text-white/70">{t('kontakt.emailLabel')}</span>
            <input
              type="email"
              required
              className={inputClass}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </label>
          <label className="flex flex-col gap-1.5 text-sm">
            <span className="font-medium text-white/70">{t('kontakt.messageLabel')}</span>
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
            {t('kontakt.submit')}
          </Button>
        </form>
      )}
    </LegalPageLayout>
  )
}
