import { LegalPageLayout } from './LegalPageLayout'
import { Placeholder } from './Placeholder'

export function DatenschutzPage() {
  return (
    <LegalPageLayout title="Datenschutzerklärung">
      <p className="text-white/50">Stand: <Placeholder>Datum eintragen</Placeholder></p>

      <section>
        <h2 className="mb-2 text-lg font-bold text-white">1. Verantwortlicher</h2>
        <p>
          Verantwortlicher im Sinne der Datenschutz-Grundverordnung (DSGVO) ist:
          <br />
          9011 Entertainment Ltd, Great Ancoats Street, M4 6DE Manchester, Vereinigtes
          Königreich, office@9011soccer.com
        </p>
      </section>

      <section>
        <h2 className="mb-2 text-lg font-bold text-white">2. Welche Daten wir verarbeiten</h2>
        <p className="mb-2 font-semibold text-white/90">Konto &amp; Anmeldung</p>
        <p>
          Bei der Registrierung erheben wir E-Mail-Adresse, Passwort (verschlüsselt gespeichert)
          und optional deinen Namen. Die Authentifizierung erfolgt über unseren technischen
          Dienstleister Supabase.
        </p>
        <p className="mb-2 mt-3 font-semibold text-white/90">Organisations-/Vereinsdaten</p>
        <p>Name deiner Organisation/deines Vereins sowie ein optional hochgeladenes Vereinslogo.</p>
        <p className="mb-2 mt-3 font-semibold text-white/90">Kader- und Spielerdaten</p>
        <p>
          Wenn du einen Kader anlegst, verarbeiten wir die von dir eingegebenen Daten zu
          Spieler:innen (Name, Rückennummer, Position, optional ein Foto). Diese Daten gibst du
          als Trainer:in bzw. Verein ein und bist dafür verantwortlich, dass eine
          Rechtsgrundlage dafür besteht — bei minderjährigen Spieler:innen insbesondere die
          Einwilligung der Erziehungsberechtigten.
        </p>
        <p className="mb-2 mt-3 font-semibold text-white/90">Taktik-Projekte</p>
        <p>
          Von dir erstellte Formationen, Spielzüge, Frames und Beschriftungen werden
          gespeichert, damit du sie später weiter bearbeiten kannst.
        </p>
        <p className="mb-2 mt-3 font-semibold text-white/90">Kontaktformular</p>
        <p>
          Wenn du das Kontaktformular nutzt, verarbeiten wir Name, E-Mail-Adresse und deine
          Nachricht, um deine Anfrage zu beantworten.
        </p>
      </section>

      <section>
        <h2 className="mb-2 text-lg font-bold text-white">3. Zwecke und Rechtsgrundlagen</h2>
        <p>
          Die Verarbeitung erfolgt zur Erfüllung des Nutzungsvertrags über den Dienst (Art. 6
          Abs. 1 lit. b DSGVO) sowie, bei der Bearbeitung von Kontaktanfragen, auf Grundlage
          unseres berechtigten Interesses an einer effizienten Kommunikation (Art. 6 Abs. 1
          lit. f DSGVO).
        </p>
      </section>

      <section>
        <h2 className="mb-2 text-lg font-bold text-white">4. Hosting und Auftragsverarbeiter</h2>
        <p>
          Wir setzen folgende Dienstleister ein, die als Auftragsverarbeiter in unserem Auftrag
          tätig werden bzw. für den technischen Betrieb notwendig sind:
        </p>
        <ul className="ml-5 list-disc">
          <li>
            <strong>Supabase</strong> — Datenbank, Authentifizierung und Datei-Speicherung
            (Vereinslogos, Spielerfotos).
          </li>
          <li>
            <strong>Vercel</strong> — Hosting der Website/Anwendung.
          </li>
        </ul>
        <p className="mt-2">
          <Placeholder>
            Bitte prüfen und ergänzen: Serverstandort(e) der genutzten Supabase-/Vercel-Region,
            ggf. Abschluss von Auftragsverarbeitungsverträgen (Art. 28 DSGVO) sowie
            Standardvertragsklauseln bei Datenübermittlung in Drittländer (z.B. USA).
          </Placeholder>
        </p>
      </section>

      <section>
        <h2 className="mb-2 text-lg font-bold text-white">5. Cookies und lokale Speicherung</h2>
        <p>
          Zur Aufrechterhaltung deiner Anmeldung verwenden wir eine technisch notwendige
          Sitzungsspeicherung im lokalen Speicher (localStorage) deines Browsers. Wir setzen
          derzeit keine Tracking- oder Marketing-Cookies und keine Analyse-Tools von
          Drittanbietern ein.
        </p>
      </section>

      <section>
        <h2 className="mb-2 text-lg font-bold text-white">6. Speicherdauer</h2>
        <p>
          Wir speichern deine Daten, solange dein Nutzerkonto besteht. Nach Löschung des
          Kontos werden die zugehörigen Daten gelöscht, soweit keine gesetzlichen
          Aufbewahrungspflichten entgegenstehen. Nachrichten über das Kontaktformular werden
          gelöscht, sobald die Anfrage abschließend bearbeitet ist.
        </p>
      </section>

      <section>
        <h2 className="mb-2 text-lg font-bold text-white">7. Deine Rechte</h2>
        <p>
          Du hast das Recht auf Auskunft, Berichtigung, Löschung, Einschränkung der
          Verarbeitung, Datenübertragbarkeit sowie Widerspruch gegen die Verarbeitung deiner
          Daten. Zudem hast du das Recht, dich bei der zuständigen Datenschutz-Aufsichtsbehörde
          (im Vereinigten Königreich das Information Commissioner's Office, ico.org.uk) zu
          beschweren.
        </p>
      </section>

      <section>
        <h2 className="mb-2 text-lg font-bold text-white">8. Datensicherheit</h2>
        <p>
          Wir treffen angemessene technische und organisatorische Maßnahmen, um deine Daten vor
          Verlust, Missbrauch und unbefugtem Zugriff zu schützen (z.B. verschlüsselte
          Übertragung, Zugriffsbeschränkung je Organisation).
        </p>
      </section>

      <section>
        <h2 className="mb-2 text-lg font-bold text-white">9. Kontakt</h2>
        <p>
          Für Fragen zum Datenschutz erreichst du uns unter{' '}
          <a href="mailto:office@9011soccer.com" className="text-brand-gold underline">
            office@9011soccer.com
          </a>{' '}
          oder über unser <a href="/kontakt" className="text-brand-gold underline">Kontaktformular</a>.
        </p>
      </section>
    </LegalPageLayout>
  )
}
