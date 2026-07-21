# TacticBoard Pro

Professionelle Taktik- und Trainings-Board-Plattform für Fußballtrainer. Dieses
Repository enthält **Phase 1 (Editor-MVP)** und **Phase B2 (Kaderverwaltung &
Formationen)**: einen vollwertigen Canvas-Taktik-Editor mit Login, echter
Kaderverwaltung, Formations-System und Bild-Export gegen ein echtes
Supabase-Backend.

## Stack

- **Frontend:** React 19 + TypeScript (strict) + Vite + Tailwind CSS v4
- **Canvas:** Konva.js / react-konva
- **State:** Zustand
- **Backend:** Supabase (Postgres, Auth, Row Level Security, Storage)
- **Routing:** react-router-dom

## Features

**Phase 1 (Editor-MVP):**
- Email/Passwort-Login & Signup mit automatischem Org+Profil-Bootstrap
- Taktik-Editor: 3 Feld-Designs (inkl. Stadion-Kulisse mit Tribünen), 2
  Ausrichtungen, Spieler-Chips (Heim/Auswärts), Pfeile (gerade/kurvig), Formen
  (Kreis/Rechteck/Polygon), Text, Trainingsequipment (Hütchen, Minitor, Dummy,
  Slalomstange, Leiter), Ball – icon-basierte Werkzeugleiste
- Frame-System mit Undo/Redo, Duplizieren, Reorder, und Wiedergabe mit
  Tween-Interpolation zwischen Frames
- Speichern/Laden von Projekten gegen Supabase, projektbezogene RLS
- Dashboard mit Free-Tier-Limit (3 Projekte, 7 Frames/Projekt), Vereinslogo-Upload
- PNG/JPG-Export (Auflösung je nach Tier begrenzt)
- Tastenkürzel: `Strg+S` Speichern, `Strg+Z` / `Strg+Shift+Z` Undo/Redo,
  `Strg+D` Duplizieren, `Entf` Löschen, `Esc` Auswahl aufheben, `Leertaste` Play

**Phase B2 (Kaderverwaltung & Formationen):**
- `/squad` – Kaderverwaltung pro Team (Spieler anlegen/bearbeiten/löschen:
  Rückennummer, Position, Nebenposition, starker Fuß, Kontaktdaten, Notizen)
- `/formations` – 4 Formationsvorlagen (4-4-2, 4-3-3, 4-2-3-1, 3-5-2) plus eigene,
  gespeicherte Formationen
- Im Editor: echte Kaderspieler per Klick als Spieler-Chip platzieren (Name +
  Rückennummer statt generischer Nummer), Formation auf den aktiven Frame anwenden
  (positioniert alle Heim-Chips automatisch und verknüpft sie mit echten Spielern
  in Rückennummer-Reihenfolge)
- Vereinslogo erscheint auf Heim-Spieler-Chips, sobald hochgeladen

**Nicht Teil dieses Repos** (siehe Roadmap unten): Übungsdatenbank, PDF-Export,
Video-Export, Stripe-Billing, öffentliche Landingpage, Kollaboration,
Team-Vereins-Rollen, Google-OAuth.

## Setup

### Voraussetzungen

- Node.js 20+ und npm
- Ein Supabase-Projekt (siehe unten)

### 1. Abhängigkeiten installieren

```bash
npm install
```

### 2. Supabase-Projekt verbinden

**Option A – dieses Repo nutzt bereits ein bestehendes Supabase-Projekt** (Org
`semmi99`, Projekt `tacticboard-pro`, Region `eu-central-1`). Kopiere `.env.example`
zu `.env` und trage die Werte aus dem Supabase-Dashboard ein (Project Settings → API):

```bash
cp .env.example .env
```

```env
VITE_SUPABASE_URL=https://<project-ref>.supabase.co
VITE_SUPABASE_ANON_KEY=<anon/publishable key>
```

**Option B – eigenes/neues Supabase-Projekt aufsetzen:**

1. Projekt unter [supabase.com](https://supabase.com) anlegen.
2. Die Migrationen in `supabase/migrations/` **in numerischer Reihenfolge** über den
   SQL-Editor im Supabase-Dashboard ausführen (oder via Supabase CLI: `supabase db push`,
   falls lokal mit der CLI verlinkt).
3. `.env` wie oben mit den Werten des neuen Projekts befüllen.
4. Email-Bestätigung: Standardmäßig verlangt Supabase Auth eine Email-Bestätigung
   vor dem ersten Login. Für schnelles lokales Testen kann das unter
   **Authentication → Providers → Email → Confirm email** deaktiviert werden.
5. Für den U18-Kader-Import: `supabase/seed/import_u18_squad.sql` ist an eine
   konkrete Org/Team-ID aus dem bestehenden Projekt gebunden und muss für ein
   neues Projekt angepasst werden (siehe Kommentar in der Datei).

### 3. Dev-Server starten

```bash
npm run dev
```

App läuft unter `http://localhost:5173`.

### 4. Build

```bash
npm run build
```

## Datenbank-Schema

Die Migrationen in `supabase/migrations/` bauen das Schema inkrementell auf:

- `001_init.sql` – Kern-Tabellen (`organizations`, `profiles`, `teams`, `projects`,
  `frames`, `frame_objects`) mit org-scoped RLS auf jeder Tabelle, plus Signup-Trigger,
  der automatisch eine Organisation + ein Admin-Profil anlegt.
- `002_harden_functions.sql` – verschiebt Helper-Funktionen in ein nicht über die
  REST-API exponiertes `private`-Schema (behebt Supabase-Security-Advisor-Warnungen).
- `003_project_canvas_settings.sql` – ergänzt `pitch_design`/`orientation` auf
  `projects`, damit die Canvas-Einstellungen mitgespeichert werden.
- `004_stadium_pitch_design.sql` – erweitert die `pitch_design`-Check-Constraint um
  `stadium_bowl`.
- `005_org_logo_storage.sql` – Storage-Bucket `org-logos` (public read, org-scoped
  write) für Vereinslogos.
- `006_players_formations.sql` – `players`- und `formations`-Tabellen,
  `frames.formation_id`, `frame_objects.player_id`.

Weitere Tabellen (`exercises`, `subscriptions`, …) kommen in späteren Phasen als
eigene Migrationen dazu.

## Deploy (Vercel)

1. Repo zu GitHub pushen, in Vercel importieren.
2. Build-Command: `npm run build`, Output-Directory: `dist`.
3. Environment-Variablen `VITE_SUPABASE_URL` und `VITE_SUPABASE_ANON_KEY` in den
   Vercel-Projekteinstellungen setzen (gleiche Werte wie in `.env`).
4. In Supabase unter **Authentication → URL Configuration** die Vercel-Domain als
   Redirect-URL eintragen.

## Stripe-Billing einrichten

Die drei Edge Functions (`stripe-checkout`, `stripe-portal`, `stripe-webhook`,
siehe `supabase/functions/`) sowie die DB-Felder auf `organizations`
(`stripe_customer_id`, `stripe_subscription_id`, `subscription_status`) sind
bereits deployed/migriert. Ohne die folgenden Secrets antworten
`stripe-checkout`/`stripe-portal` mit „Stripe ist noch nicht konfiguriert“ und
`stripe-webhook` mit HTTP 503 — bis dahin bleibt Free/Pro rein manuell (siehe
Plattform-Admin-Dashboard, „Kostenloser, unbegrenzter Zugang“-Haken).

Sobald ein Stripe-Konto existiert:

1. **Produkt anlegen:** In Stripe unter *Product catalog* ein Produkt „Pro“ mit
   einem wiederkehrenden Preis von 4,99 €/Monat anlegen → die **Price-ID**
   (`price_...`) notieren.
2. **Secrets in Supabase setzen** (Dashboard → Edge Functions → Secrets, oder
   `supabase secrets set` via CLI):
   - `STRIPE_SECRET_KEY` – der Secret Key aus Stripe (Test- oder Live-Modus)
   - `STRIPE_PRICE_ID_PRO` – die Price-ID aus Schritt 1
   - `APP_URL` – die öffentliche URL der App (z.B. `https://tacticboard.pro`),
     für die Checkout-Redirect-Ziele
   - `STRIPE_WEBHOOK_SECRET` – erst nach Schritt 3 verfügbar
3. **Webhook registrieren:** In Stripe unter *Developers → Webhooks* einen
   Endpoint auf `https://<project-ref>.supabase.co/functions/v1/stripe-webhook`
   anlegen, mit den Events `customer.subscription.created`,
   `customer.subscription.updated`, `customer.subscription.deleted` und
   `invoice.payment_failed`. Das dabei angezeigte **Signing secret**
   (`whsec_...`) als `STRIPE_WEBHOOK_SECRET` in Supabase hinterlegen.
4. Fertig — „Pro werden“ auf der Konto-Seite startet jetzt einen echten
   Stripe-Checkout, und der Webhook schaltet `organizations.subscription_tier`
   automatisch auf `pro`/`free` um.

## Vor Produktivbetrieb

- Supabase Security Advisor meldet **„Leaked Password Protection Disabled“** – unter
  **Authentication → Policies** aktivieren (prüft Passwörter gegen HaveIBeenPwned).
  Ein einfacher Dashboard-Toggle, nicht Teil der Migrationen.

## Bekannte Einschränkungen

- **Google OAuth:** Code-seitig vorbereitet, aber deaktiviert. Für Aktivierung
  muss in der Google Cloud Console ein OAuth-Client angelegt und die Zugangsdaten
  unter Supabase **Authentication → Providers → Google** hinterlegt werden.
- **Thumbnails im Dashboard:** aktuell ein generisches Platzhalter-Icon; echte
  Screenshot-Thumbnails sind ein guter Fast-Follow, sobald der PNG-Export-Pfad
  (bereits vorhanden) an einen Storage-Upload beim Speichern angebunden wird.
- **Spieler auf die Canvas ziehen:** aktuell Klick-zum-Auswählen +
  Klick-zum-Platzieren statt echtem Drag&Drop aus der Kaderliste (funktional
  gleichwertig, aber ohne Drag-Geste).
- **„Several Konva instances detected“**-Warnung in der Browser-Konsole: bekannte,
  harmlose Warnung, die entsteht, weil sowohl `konva` als auch `react-konva`
  Vite/esbuild-seitig ihre eigene Kopie der Bibliothek pre-bundlen. Wirkt sich in
  Tests nicht auf Funktionalität aus (Konva arbeitet intern duck-typed).

## Roadmap

- **B3:** Übungsdatenbank & Trainingsplan-Baukasten, PDF-Export (mehrere Templates),
  Video-Export, Stripe-Billing (Free/Pro/Club), Marketing-Landingpage,
  Team-Kollaboration & Vereins-Branding
