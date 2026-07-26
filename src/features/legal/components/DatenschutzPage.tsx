import { useTranslation } from 'react-i18next'
import { LegalPageLayout } from './LegalPageLayout'
import { Placeholder } from './Placeholder'

export function DatenschutzPage() {
  const { t, i18n } = useTranslation('legal')
  return (
    <LegalPageLayout title={t('datenschutz.title')}>
      {i18n.language !== 'de' && (
        <p className="text-xs italic text-white/40">{t('datenschutz.translationNote')}</p>
      )}
      <p className="text-white/50">
        {t('datenschutz.lastUpdatedLabel')}{' '}
        <Placeholder>{t('datenschutz.placeholderEnterDate')}</Placeholder>
      </p>

      <section>
        <h2 className="mb-2 text-lg font-bold text-white">{t('datenschutz.sections.s1.title')}</h2>
        <p>
          {t('datenschutz.sections.s1.bodyBefore')}
          <br />
          {t('datenschutz.sections.s1.bodyAfter')}
        </p>
      </section>

      <section>
        <h2 className="mb-2 text-lg font-bold text-white">{t('datenschutz.sections.s2.title')}</h2>
        <p className="mb-2 font-semibold text-white/90">{t('datenschutz.sections.s2.accountTitle')}</p>
        <p>{t('datenschutz.sections.s2.accountBody')}</p>
        <p className="mb-2 mt-3 font-semibold text-white/90">{t('datenschutz.sections.s2.orgTitle')}</p>
        <p>{t('datenschutz.sections.s2.orgBody')}</p>
        <p className="mb-2 mt-3 font-semibold text-white/90">{t('datenschutz.sections.s2.squadTitle')}</p>
        <p>{t('datenschutz.sections.s2.squadBody')}</p>
        <p className="mb-2 mt-3 font-semibold text-white/90">{t('datenschutz.sections.s2.projectsTitle')}</p>
        <p>{t('datenschutz.sections.s2.projectsBody')}</p>
        <p className="mb-2 mt-3 font-semibold text-white/90">{t('datenschutz.sections.s2.contactFormTitle')}</p>
        <p>{t('datenschutz.sections.s2.contactFormBody')}</p>
      </section>

      <section>
        <h2 className="mb-2 text-lg font-bold text-white">{t('datenschutz.sections.s3.title')}</h2>
        <p>{t('datenschutz.sections.s3.body')}</p>
      </section>

      <section>
        <h2 className="mb-2 text-lg font-bold text-white">{t('datenschutz.sections.s4.title')}</h2>
        <p>{t('datenschutz.sections.s4.intro')}</p>
        <ul className="ml-5 list-disc">
          <li>
            <strong>Supabase</strong> — {t('datenschutz.sections.s4.supabaseBody')}
          </li>
          <li>
            <strong>Vercel</strong> — {t('datenschutz.sections.s4.vercelBody')}
          </li>
        </ul>
        <p className="mt-2">{t('datenschutz.sections.s4.locationsBody')}</p>
      </section>

      <section>
        <h2 className="mb-2 text-lg font-bold text-white">{t('datenschutz.sections.s5.title')}</h2>
        <p>{t('datenschutz.sections.s5.body')}</p>
      </section>

      <section>
        <h2 className="mb-2 text-lg font-bold text-white">{t('datenschutz.sections.s6.title')}</h2>
        <p>{t('datenschutz.sections.s6.body')}</p>
      </section>

      <section>
        <h2 className="mb-2 text-lg font-bold text-white">{t('datenschutz.sections.s7.title')}</h2>
        <p>{t('datenschutz.sections.s7.body')}</p>
      </section>

      <section>
        <h2 className="mb-2 text-lg font-bold text-white">{t('datenschutz.sections.s8.title')}</h2>
        <p>{t('datenschutz.sections.s8.body')}</p>
      </section>

      <section>
        <h2 className="mb-2 text-lg font-bold text-white">{t('datenschutz.sections.s9.title')}</h2>
        <p>
          {t('datenschutz.sections.s9.bodyBefore')}{' '}
          <a href="mailto:office@9011soccer.com" className="text-brand-gold underline">
            office@9011soccer.com
          </a>{' '}
          {t('datenschutz.sections.s9.bodyMiddle')}{' '}
          <a href="/kontakt" className="text-brand-gold underline">
            {t('datenschutz.sections.s9.contactFormLink')}
          </a>
          .
        </p>
      </section>
    </LegalPageLayout>
  )
}
