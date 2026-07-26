import { useTranslation } from 'react-i18next'
import { FREE_TIER_LIMITS, PRO_TIER_LIMITS } from '../../../lib/limits'
import { LegalPageLayout } from './LegalPageLayout'
import { Placeholder } from './Placeholder'

export function AgbPage() {
  const { t, i18n } = useTranslation('legal')
  return (
    <LegalPageLayout title={t('agb.title')}>
      {i18n.language !== 'de' && (
        <p className="text-xs italic text-white/40">{t('agb.translationNote')}</p>
      )}
      <p className="text-white/50">
        {t('agb.lastUpdatedLabel')} <Placeholder>{t('agb.placeholderEnterDate')}</Placeholder>
      </p>

      <section>
        <h2 className="mb-2 text-lg font-bold text-white">{t('agb.sections.s1.title')}</h2>
        <p>{t('agb.sections.s1.body')}</p>
      </section>

      <section>
        <h2 className="mb-2 text-lg font-bold text-white">{t('agb.sections.s2.title')}</h2>
        <p>{t('agb.sections.s2.body')}</p>
      </section>

      <section>
        <h2 className="mb-2 text-lg font-bold text-white">{t('agb.sections.s3.title')}</h2>
        <p>{t('agb.sections.s3.body')}</p>
      </section>

      <section>
        <h2 className="mb-2 text-lg font-bold text-white">{t('agb.sections.s4.title')}</h2>
        <p>{t('agb.sections.s4.intro')}</p>
        <ul className="ml-5 list-disc">
          <li>
            <strong>{t('agb.pricing.freeLabel')}</strong>{' '}
            {t('agb.pricing.freeBody', {
              maxProjects: FREE_TIER_LIMITS.maxProjects,
              maxFrames: FREE_TIER_LIMITS.maxFrames,
              maxExportPixelRatio: FREE_TIER_LIMITS.maxExportPixelRatio,
            })}
          </li>
          <li>
            <strong>{t('agb.pricing.proLabel')}</strong>{' '}
            {t('agb.pricing.proBody', { maxExportPixelRatio: PRO_TIER_LIMITS.maxExportPixelRatio })}
          </li>
        </ul>
        <p className="mt-2">
          <Placeholder>{t('agb.pricing.paymentNote')}</Placeholder>
        </p>
      </section>

      <section>
        <h2 className="mb-2 text-lg font-bold text-white">{t('agb.sections.s5.title')}</h2>
        <p>
          {t('agb.sections.s5.bodyBefore')}{' '}
          <Placeholder>{t('agb.placeholderMonthlyAnytime')}</Placeholder>{' '}
          {t('agb.sections.s5.bodyAfter')}
        </p>
      </section>

      <section>
        <h2 className="mb-2 text-lg font-bold text-white">{t('agb.sections.s6.title')}</h2>
        <p>{t('agb.sections.s6.body')}</p>
      </section>

      <section>
        <h2 className="mb-2 text-lg font-bold text-white">{t('agb.sections.s7.title')}</h2>
        <p>{t('agb.sections.s7.body')}</p>
      </section>

      <section>
        <h2 className="mb-2 text-lg font-bold text-white">{t('agb.sections.s8.title')}</h2>
        <p>{t('agb.sections.s8.body')}</p>
      </section>

      <section>
        <h2 className="mb-2 text-lg font-bold text-white">{t('agb.sections.s9.title')}</h2>
        <p>{t('agb.sections.s9.body')}</p>
      </section>

      <section>
        <h2 className="mb-2 text-lg font-bold text-white">{t('agb.sections.s10.title')}</h2>
        <p>{t('agb.sections.s10.body')}</p>
      </section>
    </LegalPageLayout>
  )
}
