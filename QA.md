# Prüfprotokoll und Abnahme

Stand 21.09.2026. **Nicht als vollständig abgenommene Produktionsversion behandeln.**

## Automatisiert

| Prüfung                                         | Ergebnis                                                                  |
| ----------------------------------------------- | ------------------------------------------------------------------------- |
| `npm test`                                      | 21/21 bestanden                                                           |
| `npm run build`                                 | Typecheck und Produktionsbuild erfolgreich                                |
| `npm run format:check`                          | Bestanden                                                                 |
| Server-Bundle-Prüfung mit esbuild, Node-22-Ziel | Beide Functions erfolgreich gebündelt                                     |
| `npm audit --omit=dev`                          | 0 gemeldete Schwachstellen in Produktionsabhängigkeiten zum Prüfzeitpunkt |

Der Build meldet zwei `use client`-Direktivwarnungen aus Lucide. Die App ist vollständig
clientseitig gerendert (kein React-Server-Components-Build); der Build endet erfolgreich.
Diese Warnung ist nicht als Browser-Laufzeitprüfung zu verstehen.

- TypeScript-Prüfung und Vite-Produktionsbuild.
- Unit-Tests: CHF/Laufmeter-Rechnung, Eingabebereiche, Importvalidierung, Variantensnapshots.
- API-Tests: Konfigurationssperre, Origin/Methode/Content-Type, bestätigte Allowlist-Identität,
  Einwilligung, Bildsignatur, Grössenlimit, Timeout-/Quota-/Providerfehler, keine Secret-Leaks.
- DOM-Komponententests: Demo-Kennzeichnung, Farbwechsel/Materialempfehlung ohne falsche
  Bildänderung, Längenvalidierung, Vergleichsschieber, Variantenwechsel, Kundenansicht,
  Generierungssperre, Speichern/Wiederöffnen in IndexedDB, neues Projekt ohne Demoassets.
- In den Komponententests sind API, native Dialoganzeige und Browserdatenbank simuliert.
  Sie sind **kein Ersatz für einen echten Browser- oder Live-KI-Test**.

## In dieser Umgebung nicht verifiziert

Der lokale Netlify-Entwicklungsserver konnte wegen eingeschränkter Netzwerk-Systemfunktionen
nicht starten. Der verfügbare Prüf-Browser blockiert lokale URLs/Dateien. Es wurde keine
externe Vorschau veröffentlicht, um diese Einschränkung zu umgehen.

Deshalb **offen**: echte Layout-Screenshots, horizontaler Überlauf, Tastaturfokus und native
Dialog-Fokusbindung, Reduced-Motion-Darstellung, Kamera, EXIF-Prüfung, Druck-/PDF-Layout,
echte Dateidownloads und reales Identity/Gateway-End-to-End. Keine erfundenen Screenshots.

## Vor internem Pilotstart auf der eigenen Netlify-Vorschau

- [ ] 1440×900: keine abgeschnittenen Controls; Raumfoto, Farbwahl, Material und Preise lesbar.
- [ ] 1280×720: alle Funktionen durch Scrollen erreichbar; Variantenliste scrollt nur lokal.
- [ ] 768×1024: einspaltiger Tabletmodus, kein horizontaler Seitenüberlauf.
- [ ] 390×844: einspaltiger Mobilmodus, Login/Projektname/Upload vollständig bedienbar.
- [ ] Browserzoom 200 %, Tab/Shift-Tab, Enter/Space, Pfeiltasten am Vergleichsschieber.
- [ ] Dialog: Fokus innen, Escape schliesst, Fokus kehrt zurück; während Generierung kein Schliessen.
- [ ] «Bewegung reduzieren» aktivieren; keine Animation/Transition mehr.
- [ ] Eigene JPG/PNG/WebP hochladen; HEIC, kaputte, zu grosse/kleine Bilder erzeugen klare Fehler.
- [ ] Mobilkamera, Upload abbrechen, vorhandenes ungespeichertes Projekt ersetzen/erhalten.
- [ ] Vorhandene Standortmetadaten sind im neu kodierten JPEG nicht mehr enthalten.
- [ ] Lokal speichern → Seite neu laden → Projekte öffnen → exakt wiederherstellen.
- [ ] JSON exportieren/importieren; abweichende Version, SVG/URL, ungültige Referenzen ablehnen.
- [ ] Lokales Projekt löschen; Exportdatei bleibt separat erhalten.
- [ ] A4-Projektblatt als PDF: aktiver Bildentwurf, dessen Material/Länge und Preisquelle stimmen.
- [ ] Sources-Links funktionieren; Marktbänder beim Pilotstart nochmals prüfen.
- [ ] Ohne Konto: Generierungs-API gesperrt; mit nicht erlaubtem Konto ebenso.
- [ ] Identity-Einladung, Login, Passwort-Reset und Logout auf echter HTTPS-Domain.
- [ ] Ein bestätigtes, erlaubtes Konto erzeugt aus einem nicht sensiblen Testfoto ein Bild.
- [ ] Das Bild passt plausibel in den Originalraum; keine falschen Masse/Anschlusszusagen.
- [ ] Fehlender Key, falscher Key, Quota, Timeout, Doppelklick und Provider-Ablehnung testen.
- [ ] Kostenüberwachung, Teamfreigaben, Datenschutz und ggf. Schutz der ganzen Site eingerichtet.

Die Funktionsabnahme erfordert mindestens eine bewusst freigegebene kostenpflichtige
Bildgenerierung. Im Rahmen der Codeerstellung wurden keine Live-Anbieteraufrufe der App ausgelöst.
