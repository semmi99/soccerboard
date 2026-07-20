import { LegalPageLayout } from './LegalPageLayout'

export function ImpressumPage() {
  return (
    <LegalPageLayout title="Impressum">
      <p>Angaben gemäß den anwendbaren gesetzlichen Bestimmungen des Vereinigten Königreichs.</p>

      <section>
        <h2 className="mb-2 text-lg font-bold text-white">Diensteanbieter</h2>
        <p>
          9011 Entertainment Ltd
          <br />
          Limited Company (England &amp; Wales)
          <br />
          Great Ancoats Street
          <br />
          M4 6DE Manchester
          <br />
          Vereinigtes Königreich
        </p>
      </section>

      <section>
        <h2 className="mb-2 text-lg font-bold text-white">Kontakt</h2>
        <p>E-Mail: office@9011soccer.com</p>
      </section>

      <section>
        <h2 className="mb-2 text-lg font-bold text-white">Vertretungsberechtigt</h2>
        <p>Friedrich Schanner</p>
      </section>

      <section>
        <h2 className="mb-2 text-lg font-bold text-white">Unternehmensrechtliche Angaben</h2>
        <p>Registernummer (Companies House): 13808099</p>
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
