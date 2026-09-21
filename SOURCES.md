# Quellen und Herkunft

Recherchestand: **21.09.2026**. Preise, Modelle und Plattformvorgaben können sich ändern.

## Palette

[Pinterest Newsroom: From Cool Blue to Persimmon – meet the 2026 Pinterest Palette](https://newsroom.pinterest.com/news/from-cool-blue-to-persimmon-meet-the-2026-pinterest-palette/),
14.01.2026. Namen und digitale Farbreferenzen: Cool Blue `#D7EFFF`, Jade `#AEB8A0`,
Plum Noir `#351E28`, Wasabi `#E9F056`, Persimmon `#FF5C34`.

Die App ist nicht von Pinterest erstellt oder empfohlen. Die Jahrespalette ist keine
Live-Suche, kein Beleg für ein aktuelles Ranking einzelner Küchen und kein Pin-Bildkatalog.
Die Texte zu Farbstimmung und Materialpaarungen sind eigene gestalterische Vorschläge.

## Schweizer Preisorientierung

[HMA Interior: Küchenarbeitsplatte – Materialvergleich](https://hma-interior.ch/ratgeber/kuechenarbeitsplatte-material-vergleich),
24.05.2026. Verwendete Tabellenbänder: Granit 400–1’000, Quarzkomposit 600–1’200,
Keramik 700–1’400 CHF/lfm bei 60 cm Tiefe. Die Tabellenanmerkung nennt Standardmontage;
besondere Leistungen sind getrennt zu prüfen. Keine unabhängige Marktstatistik,
sondern ein öffentlicher Anbieter-Ratgeber als transparente Pilot-Orientierung.

[IKEA Schweiz: Keramik-Küchenarbeitsplatten nach Mass](https://www.ikea.com/ch/de/cat/keramik-kuechenarbeitsplatten-nach-mass-46460/),
Preisbeispiele 649–749 CHF/m² bei Recherche. Nur als zusätzlicher Vergleich genannt,
**nicht** mit Laufmeterwerten verrechnet und kein Beleg für einen Montage-Gesamtpreis.

[Sanitas Troesch: Arbeitsflächen](https://www.sanitastroesch.ch/de/kueche/sortiment/arbeitsflaechen)
als zusätzliche Information zu Materialfamilien; keine Preisquelle.

Materialstärken in der App sind illustrative übliche Richtgrössen, keine Produktspezifikationen.
Leistungsumfang, MwSt., Dekor, Lieferbarkeit und Montage müssen per Offerte geklärt werden.

## Bilder

Alle vier Assets wurden für diesen Prototyp am 21.09.2026 generiert. Keine Kundendaten,
keine fremden Pinterest-Pins, keine abgebildeten bestellbaren Lieferantenprodukte.

| Datei                          | Inhalt / Gestaltungsanweisung                                                                                                                                           |
| ------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `public/images/jade.webp`      | Fiktive kompakte Schweizer Küche, matte Jade-Fronten, grauer Granit, Eichenboden, Fenster links, Hochschrank rechts; architektonische Fotografie, keine Personen/Labels |
| `public/images/room.webp`      | Bildbearbeitung des Jade-Bildes: Küche entfernen, Architektur/Perspektive/Fenster/Boden erhalten; fiktives «Vorher»                                                     |
| `public/images/plum.webp`      | Bildbearbeitung des Jade-Bildes: gleiche Raumansicht mit Plum-Noir-Fronten und dunkler Keramik                                                                          |
| `public/images/materials.webp` | Drei illustrative Texturmuster: grauer Granit, heller Quarzkomposit, dunkle Keramik; keine Schrift                                                                      |

PNG-Originale wurden ohne kreative Veränderung in WebP komprimiert. Diese Bilder beweisen
nicht die Qualität oder Raumtreue der späteren Live-API. Der Vorher/Nachher-Vergleich
wird ausdrücklich als fiktives KI-Beispiel angezeigt.

## Technische Primärquellen

- [Netlify AI Gateway und Modellliste](https://docs.netlify.com/build/ai-gateway/overview/)
- [Netlify Functions API](https://docs.netlify.com/build/functions/api/)
- [Netlify Dateikonfiguration](https://docs.netlify.com/build/configure-builds/file-based-configuration/)
- [Netlify Identity](https://docs.netlify.com/security/secure-access-to-sites/identity/)
- Mitgelieferte README und Typdefinitionen von `@netlify/identity` 2.0.0
- [Google Gemini Bildgenerierung](https://ai.google.dev/gemini-api/docs/image-generation)
- [Google generateContent API](https://ai.google.dev/api/generate-content)

Gewähltes Live-Modell: `gemini-3.1-flash-image`, gemäss Gateway-Modellliste zum Recherchezeitpunkt.
Die API-Anbindung ist implementiert, aber ohne Nutzer-Deployment und konfigurierte
Zugangsdaten nicht live durchgetestet. SDK-Versionen sind über `package-lock.json` fixiert.
