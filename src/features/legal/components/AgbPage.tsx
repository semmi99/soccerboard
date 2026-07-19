import { FREE_TIER_LIMITS, PRO_TIER_LIMITS } from '../../../lib/limits'
import { LegalPageLayout } from './LegalPageLayout'
import { Placeholder } from './Placeholder'

export function AgbPage() {
  return (
    <LegalPageLayout title="Allgemeine Geschäftsbedingungen">
      <p className="text-white/50">Stand: <Placeholder>Datum eintragen</Placeholder></p>

      <section>
        <h2 className="mb-2 text-lg font-bold text-white">1. Geltungsbereich</h2>
        <p>
          Diese Allgemeinen Geschäftsbedingungen (AGB) gelten für die Nutzung von
          „TacticBoard Pro" (nachfolgend „Dienst"), einem Angebot von{' '}
          <Placeholder>Firmenname</Placeholder> (nachfolgend „Anbieter"), erreichbar unter
          9011soccer.com und socceranalyticspro.com. Mit der Registrierung eines Nutzerkontos
          erkennt der Nutzer diese AGB an.
        </p>
      </section>

      <section>
        <h2 className="mb-2 text-lg font-bold text-white">2. Leistungsbeschreibung</h2>
        <p>
          Der Dienst ist ein browserbasierter Taktik-Editor für Sportvereine und Trainer:innen
          zur Erstellung von Aufstellungen, Spielzügen und Trainingsplänen sowie zur Verwaltung
          von Kaderdaten. Der Anbieter ist bestrebt, den Dienst dauerhaft verfügbar zu halten,
          übernimmt jedoch keine Gewähr für eine unterbrechungsfreie Verfügbarkeit.
        </p>
      </section>

      <section>
        <h2 className="mb-2 text-lg font-bold text-white">3. Registrierung und Nutzerkonto</h2>
        <p>
          Die Nutzung setzt die Erstellung eines Nutzerkontos mit gültiger E-Mail-Adresse
          voraus. Der Nutzer ist verpflichtet, seine Zugangsdaten geheim zu halten und wahre
          Angaben zu machen. Für Aktivitäten unter dem eigenen Konto haftet der Nutzer, soweit
          er sie zu vertreten hat.
        </p>
      </section>

      <section>
        <h2 className="mb-2 text-lg font-bold text-white">4. Preise und Zahlungsbedingungen</h2>
        <p>Der Dienst wird in folgenden Tarifen angeboten:</p>
        <ul className="ml-5 list-disc">
          <li>
            <strong>Free:</strong> {FREE_TIER_LIMITS.maxProjects} Projekte,{' '}
            {FREE_TIER_LIMITS.maxFrames} Frames pro Projekt, Export bis{' '}
            {FREE_TIER_LIMITS.maxExportPixelRatio}x Auflösung — kostenlos.
          </li>
          <li>
            <strong>Pro:</strong> unbegrenzte Projekte und Frames, Export bis{' '}
            {PRO_TIER_LIMITS.maxExportPixelRatio}x Auflösung — kostenpflichtig gemäß der zum
            Zeitpunkt des Abschlusses auf der Website angegebenen Preise.
          </li>
        </ul>
        <p className="mt-2">
          <Placeholder>
            Hinweis: Die Zahlungsabwicklung für den Pro-Tarif befindet sich derzeit im Aufbau.
            Diesen Abschnitt bitte aktualisieren, sobald ein Zahlungsdienstleister (z.B.
            Stripe) angebunden ist — inkl. Angaben zu Abrechnungszeitraum, Fälligkeit,
            Zahlungsmethoden und Preisänderungen.
          </Placeholder>
        </p>
      </section>

      <section>
        <h2 className="mb-2 text-lg font-bold text-white">5. Laufzeit und Kündigung</h2>
        <p>
          Kostenpflichtige Tarife können <Placeholder>monatlich / jederzeit</Placeholder> zum
          Ende des jeweiligen Abrechnungszeitraums gekündigt werden. Der Free-Tarif kann
          jederzeit durch Löschung des Kontos beendet werden. Der Anbieter kann das
          Nutzerkonto bei schwerwiegenden Verstößen gegen diese AGB sperren oder kündigen.
        </p>
      </section>

      <section>
        <h2 className="mb-2 text-lg font-bold text-white">6. Inhalte des Nutzers</h2>
        <p>
          Alle vom Nutzer eingegebenen Inhalte (Taktiken, Formationen, Kaderdaten, Fotos, Logos)
          verbleiben im Eigentum des Nutzers bzw. des jeweils Berechtigten. Der Nutzer räumt dem
          Anbieter das für die Erbringung des Dienstes notwendige, nicht-exklusive Nutzungsrecht
          ein (Speicherung, Anzeige, Export). Der Nutzer versichert, zur Nutzung hochgeladener
          Fotos und Daten (insb. von Spieler:innen) berechtigt zu sein; bei minderjährigen
          Spieler:innen ist die Einwilligung der Erziehungsberechtigten einzuholen.
        </p>
      </section>

      <section>
        <h2 className="mb-2 text-lg font-bold text-white">7. Pflichten des Nutzers</h2>
        <p>
          Der Nutzer verpflichtet sich, den Dienst nicht missbräuchlich zu nutzen, keine
          rechtswidrigen Inhalte hochzuladen und geltendes Recht (insb. Datenschutzrecht
          gegenüber Dritten, deren Daten er einträgt) einzuhalten.
        </p>
      </section>

      <section>
        <h2 className="mb-2 text-lg font-bold text-white">8. Haftungsbeschränkung</h2>
        <p>
          Der Anbieter haftet unbeschränkt für Vorsatz und grobe Fahrlässigkeit sowie für
          Schäden aus der Verletzung des Lebens, des Körpers oder der Gesundheit. Im Übrigen
          haftet der Anbieter nur bei Verletzung wesentlicher Vertragspflichten und der Höhe
          nach begrenzt auf den vorhersehbaren, vertragstypischen Schaden. Eine Haftung für
          Datenverlust besteht nicht, soweit der Schaden durch zumutbare eigene
          Datensicherung des Nutzers vermeidbar gewesen wäre.
        </p>
      </section>

      <section>
        <h2 className="mb-2 text-lg font-bold text-white">9. Änderungen der AGB</h2>
        <p>
          Der Anbieter kann diese AGB mit Wirkung für die Zukunft ändern, wenn dies aus
          triftigem Grund (z.B. Änderung der Rechtslage, des Leistungsumfangs) erforderlich
          ist. Über Änderungen wird der Nutzer rechtzeitig informiert.
        </p>
      </section>

      <section>
        <h2 className="mb-2 text-lg font-bold text-white">10. Schlussbestimmungen</h2>
        <p>
          Es gilt das Recht der Republik <Placeholder>Österreich</Placeholder> unter Ausschluss
          des UN-Kaufrechts. Gerichtsstand ist, soweit gesetzlich zulässig,{' '}
          <Placeholder>Sitz des Anbieters</Placeholder>. Sollten einzelne Bestimmungen unwirksam
          sein, bleibt die Wirksamkeit der übrigen Bestimmungen unberührt.
        </p>
      </section>
    </LegalPageLayout>
  )
}
