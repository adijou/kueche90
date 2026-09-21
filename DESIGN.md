# KÜCHE 90 — freigegebenes visuelles Briefing

Freigabe: kombinierter Entwurf aus Präzisionswerkbank, Trendatelier und Beratungsmodus.

## Implementierungsziel

Interner, deutschsprachiger Web-Pilot. Raumfoto aufnehmen/hochladen, kuratierte
Pinterest-Farbwelt auswählen, Abdeckung mit belegter CHF-Bandbreite vergleichen,
fotorealistisches Konzept erzeugen, Varianten besprechen und als Projektdatei
oder über den Druckdialog als PDF exportieren. Kein CAD und keine Gesamt-Offerte.

Arbeitsfläche, Fotoaufnahme, Material-/Quellenansicht, lokale Projektablage,
separater Kundenvergleich und geschützter KI-Zugang. Keine Marketing-Landingpage.
Netlify-fähiger Vite/React-Client mit serverseitiger Bildgenerierungsfunktion.
Kein Deployment durch diese Umsetzung.

## Gestaltung

- Graphit #202a2a für Navigation/Buttons, Weiss #ffffff und Nebel #f3f5f2 für Flächen.
- Text #202a2a, sekundär #58635f, Linien #d8ded7; Jade #aeb8a0 als aktive Auswahl.
- Pinterest-Palette als benannte Farbauswahl; Auswahl zusätzlich mit Kontur/Haken.
- System-Grotesk: Inter falls lokal verfügbar, ansonsten Arial/Helvetica/sans-serif.
- Fliesstext 14px, funktionale Labels 12–14px; rein dekorative Bild-/Varianten-Tags 9–11px.
- Serifenschrift Georgia nur für redaktionelle Überschriften und Kundenpräsentation.
- Desktop: 184px Prozessleiste, flexible 4:3-Bildfläche, 300px Materialinspektor.
- Raster 8px, Standardabstände 16/24/32px; 4–8px Radien, keine Pillen-Kartenraster.
- Mobil/Tablet unter 800px: eine Spalte, Prozessleiste ausgeblendet; alle Aktionen im Arbeitsbereich.
- Fokus: sichtbare 3px Kontur. Fehler, Auswahl, Ladezustand und Disabled explizit.
- Dialoge mit Fokusbindung, Escape und Fokus-Rückgabe; alle Controls per Tastatur.
- Bewegung: nur kurze 160ms Zustandswechsel; prefers-reduced-motion deaktiviert sie.
- Bilder: Architektur im Originalraum, keine Personen, keine erfundenen Produkte.
- Demobilder sind ausdrücklich fiktiv und KI-generiert. Keine Simulation einer
  erfolgreichen Generierung aus einem hochgeladenen Kundenfoto.

## Inhaltliche Regeln

- Quelle, Publikations-/Prüfstand und kuratierter Status bei Trends/Preisen.
- Preis ausschliesslich Abdeckung; manuelle Länge, 60cm Tiefe, In-/Exklusionen.
- Keine aus Fotos erfundenen Masse, Trendwachstumszahlen oder Garantien.
- Kein Pinterest-Scraping, keine fremden Pin-Bilder, kein Live-Trendversprechen.
- Datenschutz und Einwilligung vor Bildübertragung; Secrets nur serverseitig.

## Gestalterische No-Gos

Keine SaaS-Marketing-Karten als Ersatz für die Arbeitsfläche, keine dekorativen Verläufe,
keine zufälligen Animationen, keine erfundenen Produktlogos oder Kundenreferenzen.
Keine real wirkende Erfolgsmeldung ohne tatsächliche Generierung. Das Raumfoto bleibt
der zentrale visuelle Anker; Begleitinformationen dürfen die Bedienung nicht überlagern.

## Definition of Done

Typecheck, Build, Preis-/Import-/Servervalidierungstests; Browserprüfung bei
1440×900, 1280×720, 768×1024, 390×844; Tastatur, Reduced Motion und Fehlerzustände.
GitHub enthält Quellcode, Lockfile, Konfiguration, Quellen und Anleitung.
Live-KI und Netlify Identity werden ohne Deployment/Zugang nicht als getestet ausgegeben.
