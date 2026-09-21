# KÜCHE 90

Interner Küchen-Pilot: Raumfoto → Farbwelt → Abdeckung → KI-Konzept → Kundengespräch.
Deutsch/Schweiz, CHF, responsive React-Oberfläche und geschützte Netlify Functions.

**Status:** Quellcode vorbereitet, nicht veröffentlicht. Demo funktioniert ohne KI-Konto.
Live-KI benötigt die unten beschriebene Einrichtung und einen abschliessenden Test auf Netlify.
Build und automatisierte Prüfungen: siehe [QA.md](QA.md). Kein geprüfter Produktionsbetrieb.

## Enthalten

- Fiktives, klar bezeichnetes Beispielprojekt mit Jade-/Granit- und Plum-Noir-/Keramik-Varianten.
- Raumfoto auswählen oder Kamera-Dateiauswahl verwenden; JPG/PNG/WebP bis 12 MB.
  Vorbereitung im Browser auf maximal 1440 Pixel, neue JPEG-Kodierung ohne EXIF/GPS.
- Fünf Farben aus der offiziellen Pinterest Palette 2026, mit Quelle und Prüfstand.
  **Kuratierte Jahrespalette, kein Live-Pinterest-Feed und keine Pin-Suche.**
- Drei Materialfamilien mit gestalterischen Empfehlungen und öffentlichen Schweizer
  Preisbandbreiten. Keine bestellbaren Lieferantendekore.
- Vorher/Nachher-Schieber, bis zu sechs Varianten pro Projekt, dunkle Kundenvergleichsansicht.
- Eigene Fotos werden tatsächlich an den Bilddienst gesendet – nur nach Anmeldung,
  serverseitiger Team-Freigabe und Zustimmung. Die Demo simuliert diese Generierung nicht.
- Lokale Projekte in IndexedDB; Import/Export als JSON inklusive Bilder;
  druckbares Projektblatt über den Browser als PDF speicherbar.
- Einladungsbasierter Team-Login, Passwort-Wiederherstellung, sichere Fehlerzustände.

**Grenzen:** Kein CAD, keine automatischen Masse, keine Garantie für Raumtreue oder
physische Machbarkeit. «90» ist das gewünschte Konzeptstadium, keine 90-%-Genauigkeitszusage.
Anschlüsse, Geräte, Abstände und Ausführung muss der Projektleiter prüfen.

## Lokal starten

Node.js **22.22.2 oder neuer** (Node 22 LTS empfohlen), npm:

```bash
npm ci
npm run dev
```

Vite startet unter `http://localhost:5173`. Das Netlify-Vite-Plugin emuliert die Funktionen.
Ohne konfigurierte Zugangsdaten ist `GET /api/status` nicht bereit und Generierung gesperrt.
Für den Identity-End-to-End-Test eine echte HTTPS-Netlify-Vorschau verwenden; die lokale
Emulation ist kein Nachweis für die Anmeldung im veröffentlichten Betrieb.

```bash
npm test
npm run build
npm run format:check
```

`npm run preview` zeigt nur den statischen Build; Netlify Functions stehen dort nicht bereit.
Für eine reine Demo ist das ausreichend. Keine Kundendaten in Test-Fixtures oder Repository legen.

## Auf Netlify veröffentlichen

Diese Anleitung führt **keinen Deploy automatisch aus**.

1. In Netlify ein Projekt aus `adijou/kueche90` importieren, Branch `main`.
2. Build-Befehl: `npm run build`; Publish-Verzeichnis: `dist`; Basisverzeichnis: leer.
   Functions: `netlify/functions`. Node 22 ist in `netlify.toml` konfiguriert.
3. Für den ersten Test KI deaktiviert lassen. Der vollständige Demo-/Lokalspeicher-Workflow
   funktioniert ohne API-Key. Nicht nur den `dist`-Ordner per Drag-and-drop veröffentlichen:
   Für die Live-KI müssen die Functions mitgebaut werden.
4. Netlify Identity einschalten, **Registrierung auf «Invite only» stellen** und die
   Pilot-Mitarbeitenden einladen. Site-URL und E-Mail-Links müssen auf die richtige HTTPS-URL
   zeigen. Einladungen und Passwort-Reset werden auf der Startseite verarbeitet.
5. Netlify AI Gateway aktivieren und den Google-Zugang prüfen. Das Gateway stellt
   `GEMINI_API_KEY` und `GOOGLE_GEMINI_BASE_URL` in der Functions-Laufzeit bereit.
   Standardmodell: `gemini-3.1-flash-image` in `netlify/lib/generation.ts`.
6. In den Netlify-Umgebungsvariablen, Scope **Functions**, setzen:

   | Variable                  | Wert / Zweck                                                                                     |
   | ------------------------- | ------------------------------------------------------------------------------------------------ |
   | `KUECHE90_ENABLE_AI`      | `true`, erst nach Budget-/Datenschutzfreigabe                                                    |
   | `KUECHE90_ALLOWED_EMAILS` | Kommagetrennte, bestätigte Identity-E-Mails des Pilotteams                                       |
   | `GEMINI_API_KEY`          | Vom Gateway bereitgestellt; alternativ eigener Google-Key                                        |
   | `GOOGLE_GEMINI_BASE_URL`  | Vom Gateway bereitgestellt; bei eigenem Key explizit `https://generativelanguage.googleapis.com` |

   **Bei eigenem Key immer beide Google-Variablen setzen**, damit nicht ein eigener Key
   versehentlich an den Gateway-Endpunkt geht. Eigener Key bedeutet direkte Google-Abrechnung.
   Keine dieser Variablen darf mit `VITE_` beginnen. Keine Secrets in GitHub hochladen.

7. Deploy nach Konfiguration neu bauen. Auf der Ziel-URL prüfen:
   `/api/status` liefert `{"ready":true}`. Dies bestätigt nur vorhandene Konfiguration,
   nicht die Gültigkeit der Zugangsdaten oder ausreichendes Guthaben.
8. Mit einem bestätigten, freigegebenen Teamkonto anmelden; ein **nicht sensibles Testfoto**
   hochladen und genau einen Entwurf erzeugen. Das ist kostenpflichtig bzw. verbraucht Credits.
   Danach alle Punkte in [QA.md](QA.md) abnehmen, bevor Kundenfotos verarbeitet werden.

Die statische Demo ist bei einer normalen öffentlichen Netlify-URL erreichbar.
Nur die Generierungs-API ist durch Identity/Allowlist geschützt. Soll der **gesamte Pilot**
intern bleiben, zusätzlich Netlifys Site-Zugriffsschutz konfigurieren. `noindex` ist kein
Zugriffsschutz. Zugangsschutz und entsprechende Netlify-Tarife sind vom Betreiber zu prüfen.

### Rollback

Vor dem ersten öffentlichen Einsatz die abgenommene Git-Revision notieren. Bei Problemen
in Netlify den letzten funktionierenden Deploy erneut veröffentlichen. Alternativ den
bekannt guten Git-Stand in einem neuen Commit wiederherstellen und neu bauen.
Ein Code-Rollback ändert keine Identity-Nutzer und keine Umgebungsvariablen; diese separat
prüfen. Bei einem KI-Problem zuerst die Generierung über den Freigabeschalter sperren.

### Kosten und Betriebsgrenzen

- Ein Klick = maximal ein Anbieteraufruf; SDK-Retries sind deaktiviert.
- Anbieter-Timeout 50 Sekunden, Browser-Timeout 58 Sekunden. Ein Timeout kann dennoch
  Anbieterkosten auslösen. Absichtlich kein automatischer erneuter Versuch.
- Netlify-Rate-Limit: 6 Anfragen je IP in 60 Sekunden. Das ist **kein monatliches Budgetlimit**
  und kann bei gemeinsamem Büro-Netz mehrere Mitarbeitende betreffen.
- Gateway-/Provider-Budget und Verbrauch separat überwachen. Zum sofortigen Sperren
  `KUECHE90_ENABLE_AI=false` setzen und neue Laufzeitkonfiguration/Deploy sicherstellen.
- Synchroner Pilot, keine Warteschlange. Falls Generierungen regelmässig die Zeitlimite
  überschreiten, als nächsten Schritt Hintergrundjob + geschützte Kurzzeitablage ergänzen.
  Im aktuellen Stand gibt es keine dauerhaft gespeicherten serverseitigen Bilder.

## Preislogik

**Nur Abdeckung – nicht die ganze Küche.** Grundlage: Laufmeter bei 60 cm Tiefe.
Eine Länge wird ausschliesslich manuell eingegeben. Formel: Länge × Material-Minimum/Maximum.
Ohne gültige Länge gibt es nur den Einheitspreis, keine erfundene Gesamtsumme.

| Material      | CHF / lfm | Beispiel 4 lfm |
| ------------- | --------: | -------------: |
| Granit        | 400–1’000 |    1’600–4’000 |
| Quarzkomposit | 600–1’200 |    2’400–4’800 |
| Keramik       | 700–1’400 |    2’800–5’600 |

Quelle bezeichnet Tabellenwerte als inkl. Standardmontage. Sonderausschnitte, Kanten,
Transport, Rückwand, Steuerumfang und konkrete Leistungen mit Lieferanten klären.
Möbel, Geräte, Sanitär, Elektro und weitere Küchenleistungen sind nicht enthalten.
Keine verbindliche Offerte. Quellensammlung: [SOURCES.md](SOURCES.md).

## Daten und Sicherheit

- Lokal speichern ist explizit; Schliessen ohne Speichern kann Änderungen verlieren.
  Browserdaten löschen entfernt Projekte. JSON-Backups vertraulich aufbewahren.
- Foto + Material + Farbe + Gestaltungsnotiz werden bei bestätigter Generierung über
  Netlify an Google übertragen. Projektname und eingegebene Länge werden nicht gesendet.
- Keine App-eigene serverseitige Bildablage und keine App-Logs der Fotos/Prompts.
  Hosting-/Identitäts- und KI-Anbieter verarbeiten technische Daten nach eigenen Bedingungen.
- API prüft Methode, gleichen Origin, JSON, Einwilligung, bestätigte Identity-E-Mail,
  Allowlist, Bildtyp/-signatur, Bodygrösse und Eingabewerte. Fehlende Konfiguration sperrt.
- Import erlaubt nur Raster-Data-URLs und feste Demo-Assets, keine externen Bild-URLs/SVG/HTML.
- CSP, Frame-Sperre, No-Sniff und No-Index in `netlify.toml`; API-Antworten `no-store`.
- Keine Analytics, externen Fonts oder Pinterest-Scraper. Öffentliche Quellenlinks öffnen
  fremde Seiten erst auf Klick.
- Vor Kundenrollout: Verantwortlichen/Impressum, Datenschutzerklärung, Einwilligungsprozess,
  Anbieter-/Auftragsverarbeitungsbedingungen, Löschfristen und Zugriffsmodell festlegen.
  Der In-App-Hinweis ist kein Ersatz für die Betreiber-Datenschutzerklärung.

## Aufbau

```text
src/                  React-Oberfläche, Daten, Preis-/Projektlogik, lokale Ablage
netlify/functions/    API-Status und geschützte Bildgenerierung
netlify/lib/          Testbare Validierung, Prompt und Laufzeitkonfiguration
public/images/        Ausschliesslich fiktive, KI-generierte Demoassets
tests/                Preis-, Import-, API- und DOM-Komponententests
DESIGN.md             Freigegebenes visuelles Briefing
SOURCES.md            Herkunft der Preise, Farben, Bilder und API-Dokumentation
QA.md                 Prüfprotokoll und offene Abnahme
```

Für aktuelle Materialpreise/Farben `src/data.ts`, Quelldatum und zugehörige Tests pflegen.
Keine automatische Aussage «latest» ohne echte Datenanbindung. Für einen späteren Ausbau
kommen ein erlaubter Trend-Datenzugang, Lieferantenkataloge, belastbare Gesamtbudgetlogik,
Team-Projektablage und asynchrone Generierung infrage.
