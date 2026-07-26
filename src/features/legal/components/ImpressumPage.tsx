import { useTranslation } from 'react-i18next'
import { LegalPageLayout } from './LegalPageLayout'

export function ImpressumPage() {
  const { t } = useTranslation('legal')
  return (
    <LegalPageLayout title={t('impressum.title')}>
      <p>{t('impressum.intro')}</p>

      <section>
        <h2 className="mb-2 text-lg font-bold text-white">{t('impressum.serviceProviderTitle')}</h2>
        <p>
          9011 Entertainment Ltd
          <br />
          Limited Company (England &amp; Wales)
          <br />
          Great Ancoats Street
          <br />
          M4 6DE Manchester
          <br />
          {t('unitedKingdom')}
        </p>
      </section>

      <section>
        <h2 className="mb-2 text-lg font-bold text-white">{t('impressum.contactTitle')}</h2>
        <p>{t('impressum.contactLine')}</p>
      </section>

      <section>
        <h2 className="mb-2 text-lg font-bold text-white">{t('impressum.representativeTitle')}</h2>
        <p>Friedrich Schanner</p>
      </section>

      <section>
        <h2 className="mb-2 text-lg font-bold text-white">{t('impressum.companyDetailsTitle')}</h2>
        <p>{t('impressum.registerNumber')}</p>
      </section>

      <section>
        <h2 className="mb-2 text-lg font-bold text-white">{t('impressum.trademarksTitle')}</h2>
        <p>
          {t('impressum.trademarksBefore')} <strong>9011 Soccer</strong>{' '}
          (9011soccer.com) {t('impressum.trademarksMiddle')}{' '}
          <strong>Soccer Analytics Pro</strong> (socceranalyticspro.com){' '}
          {t('impressum.trademarksAfter')}
        </p>
      </section>

      <section>
        <h2 className="mb-2 text-lg font-bold text-white">{t('impressum.liabilityTitle')}</h2>
        <p>{t('impressum.liabilityBody')}</p>
      </section>

      <section>
        <h2 className="mb-2 text-lg font-bold text-white">{t('impressum.copyrightTitle')}</h2>
        <p>{t('impressum.copyrightBody')}</p>
      </section>
    </LegalPageLayout>
  )
}
