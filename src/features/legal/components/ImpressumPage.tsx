import { LegalPageLayout } from './LegalPageLayout'
import { Placeholder } from './Placeholder'

export function ImpressumPage() {
  return (
    <LegalPageLayout title="Impressum">
      <p>
        Angaben gemäß § 5 E-Commerce-Gesetz (ECG), § 25 Mediengesetz (MedienG) und § 14
        Unternehmensgesetzbuch (UGB).
      </p>

      <section>
        <h2 className="mb-2 text-lg font-bold text-white">Diensteanbieter</h2>
        <p>
          <Placeholder>Firmenname / Vor- und Nachname</Placeholder>
          <br />
          <Placeholder>Rechtsform (z.B. Einzelunternehmen, GmbH, e.U.)</Placeholder>
          <br />
          <Placeholder>Straße, Hausnummer</Placeholder>
          <br />
          <Placeholder>PLZ, Ort</Placeholder>
          <br />
          <Placeholder>Österreich</Placeholder>
        </p>
      </section>

      <section>
        <h2 className="mb-2 text-lg font-bold text-white">Kontakt</h2>
        <p>
          E-Mail: <Placeholder>kontakt@9011soccer.com</Placeholder>
          <br />
          Telefon: <Placeholder>+43 …</Placeholder>
        </p>
      </section>

      <section>
        <h2 className="mb-2 text-lg font-bold text-white">Vertretungsberechtigt</h2>
        <p>
          <Placeholder>Name der vertretungsbefugten Person</Placeholder>
        </p>
      </section>

      <section>
        <h2 className="mb-2 text-lg font-bold text-white">Unternehmensrechtliche Angaben</h2>
        <p>
          Firmenbuchnummer: <Placeholder>falls vorhanden, sonst entfernen</Placeholder>
          <br />
          UID-Nummer: <Placeholder>falls vorhanden, sonst entfernen</Placeholder>
          <br />
          Zuständige Aufsichtsbehörde/Gewerbebehörde: <Placeholder>falls zutreffend</Placeholder>
        </p>
      </section>

      <section>
        <h2 className="mb-2 text-lg font-bold text-white">Marken &amp; Domains</h2>
        <p>
          Diese Anwendung sowie die Marken/Domains <strong>9011 Soccer</strong>{' '}
          (9011soccer.com) und <strong>Soccer Analytics Pro</strong> (socceranalyticspro.com)
          werden von der oben genannten Person/dem oben genannten Unternehmen betrieben.
        </p>
      </section>

      <section>
        <h2 className="mb-2 text-lg font-bold text-white">EU-Streitschlichtung</h2>
        <p>
          Die Europäische Kommission stellt eine Plattform zur Online-Streitbeilegung (OS)
          bereit, abrufbar unter{' '}
          <a
            href="https://ec.europa.eu/consumers/odr"
            target="_blank"
            rel="noreferrer"
            className="text-brand-gold underline"
          >
            ec.europa.eu/consumers/odr
          </a>
          . Wir sind zur Teilnahme an einem Streitbeilegungsverfahren vor einer
          Verbraucherschlichtungsstelle <Placeholder>weder verpflichtet noch bereit / bereit, Details ergänzen</Placeholder>.
        </p>
      </section>

      <section>
        <h2 className="mb-2 text-lg font-bold text-white">Haftung für Inhalte und Links</h2>
        <p>
          Trotz sorgfältiger inhaltlicher Kontrolle übernehmen wir keine Haftung für die Inhalte
          externer Links. Für den Inhalt der verlinkten Seiten sind ausschließlich deren
          Betreiber verantwortlich.
        </p>
      </section>

      <section>
        <h2 className="mb-2 text-lg font-bold text-white">Urheberrecht</h2>
        <p>
          Alle Inhalte dieser Website (Texte, Grafiken, Logos, Software) sind urheberrechtlich
          geschützt. Jede Verwendung außerhalb der Grenzen des Urheberrechts bedarf der
          vorherigen schriftlichen Zustimmung.
        </p>
      </section>
    </LegalPageLayout>
  )
}
