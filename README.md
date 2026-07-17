# TacticBoard Pro

Professionelle Taktik- und Trainings-Board-Plattform für Fußballtrainer. Dieses
Repository enthält **Phase 1 (Editor-MVP)**: einen vollwertigen Canvas-Taktik-Editor
mit Login, Projektverwaltung und Bild-Export gegen ein echtes Supabase-Backend.

## Stack

- **Frontend:** React 19 + TypeScript (strict) + Vite + Tailwind CSS v4
- **Canvas:** Konva.js / react-konva
- **State:** Zustand
- **Backend:** Supabase (Postgres, Auth, Row Level Security)
- **Routing:** react-router-dom

## Features (Phase 1)

- Email/Passwort-Login & Signup mit automatischem Org+Profil-Bootstrap
- Taktik-Editor: 2 Feld-Designs, 2 Ausrichtungen, Spieler-Chips (Heim/Auswärts),
  Pfeile (gerade/kurvig), Formen (Kreis/Rechteck/Polygon), Text, Trainingsequipment
  (Hütchen, Minitor, Dummy, Slalomstange, Leiter), Ball
- Frame-System mit Undo/Redo, Duplizieren, Reorder, und Wiedergabe mit
  Tween-Interpolation zwischen Frames
- Speichern/Laden von Projekten gegen Supabase, projektbezogene RLS
- Dashboard mit Free-Tier-Limit (3 Projekte, 7 Frames/Projekt)
- PNG/JPG-Export (Auflösung je nach Tier begrenzt)
- Tastenkürzel: `Strg+S` Speichern, `Strg+Z` / `Strg+Shift+Z` Undo/Redo,
  `Strg+D` Duplizieren, `Entf` Löschen, `Esc` Auswahl aufheben, `Leertaste` Play

**Nicht Teil von Phase 1** (siehe Roadmap unten): Kaderverwaltung, Formationsvorlagen,
Übungsdatenbank, PDF-Export, Video-Export, Stripe-Billing, öffentliche Landingpage,
Kollaboration, Vereins-Branding, Google-OAuth.

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

Weitere Tabellen (`players`, `formations`, `exercises`, `subscriptions`, …) kommen
in den Folge-Phasen als eigene Migrationen dazu.

## Deploy (Vercel)

1. Repo zu GitHub pushen, in Vercel importieren.
2. Build-Command: `npm run build`, Output-Directory: `dist`.
3. Environment-Variablen `VITE_SUPABASE_URL` und `VITE_SUPABASE_ANON_KEY` in den
   Vercel-Projekteinstellungen setzen (gleiche Werte wie in `.env`).
4. In Supabase unter **Authentication → URL Configuration** die Vercel-Domain als
   Redirect-URL eintragen.

## Bekannte Einschränkungen

- **Google OAuth:** Code-seitig vorbereitet, aber deaktiviert. Für Aktivierung
  muss in der Google Cloud Console ein OAuth-Client angelegt und die Zugangsdaten
  unter Supabase **Authentication → Providers → Google** hinterlegt werden.
- **Thumbnails im Dashboard:** aktuell ein generisches Platzhalter-Icon; echte
  Screenshot-Thumbnails sind ein guter Fast-Follow, sobald der PNG-Export-Pfad
  (bereits vorhanden) an einen Storage-Upload beim Speichern angebunden wird.
- **„Several Konva instances detected“**-Warnung in der Browser-Konsole: bekannte,
  harmlose Warnung, die entsteht, weil sowohl `konva` als auch `react-konva`
  Vite/esbuild-seitig ihre eigene Kopie der Bibliothek pre-bundlen. Wirkt sich in
  Tests nicht auf Funktionalität aus (Konva arbeitet intern duck-typed).

## Roadmap

- **B2:** Echte Kaderverwaltung (inkl. Import des bestehenden U18-Kaders von
  Rapid Kapfenberg aus `data/spielakte-backup_2026-07-11.json`), Formations-System
  mit Vorlagen (4-4-2, 4-3-3, …) und Positions-Rollen
- **B3:** Übungsdatenbank & Trainingsplan-Baukasten, PDF-Export (mehrere Templates),
  Video-Export, Stripe-Billing (Free/Pro/Club), Marketing-Landingpage,
  Team-Kollaboration & Vereins-Branding
