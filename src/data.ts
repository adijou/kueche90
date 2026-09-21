export const SOURCES = {
  trends:
    'https://newsroom.pinterest.com/news/from-cool-blue-to-persimmon-meet-the-2026-pinterest-palette/',
  prices: 'https://hma-interior.ch/ratgeber/kuechenarbeitsplatte-material-vergleich',
  benchmark: 'https://www.ikea.com/ch/de/cat/keramik-kuechenarbeitsplatten-nach-mass-46460/',
  properties: 'https://www.sanitastroesch.ch/de/kueche/sortiment/arbeitsflaechen',
};
export const RESEARCH_DATE = '21.09.2026';
export const COLORS = [
  {
    id: 'blue',
    name: 'Cool Blue',
    hex: '#D7EFFF',
    mood: 'Licht. Klar. Leicht.',
    description: 'Kühles Blau, ruhige Flächen und helle Mineralität.',
    material: 'quartz',
    reason: 'Heller Quarzkomposit hält die kühle Farbwelt offen und ruhig.',
  },
  {
    id: 'jade',
    name: 'Jade',
    hex: '#AEB8A0',
    mood: 'Natürlich. Ruhig. Zeitlos.',
    description: 'Mineralisches Grün trifft auf natürliche Oberflächen.',
    material: 'granite',
    reason: 'Die lebendige Körnung von Granit ergänzt das mineralische Grün.',
  },
  {
    id: 'plum',
    name: 'Plum Noir',
    hex: '#351E28',
    mood: 'Tiefe mit Charakter.',
    description: 'Dunkle Pflaume, klare Linien und bewusste Kontraste.',
    material: 'ceramic',
    reason: 'Dunkle Keramik unterstützt die tiefe, reduzierte Farbwirkung.',
  },
  {
    id: 'wasabi',
    name: 'Wasabi',
    hex: '#E9F056',
    mood: 'Ein frischer Akzent.',
    description: 'Gelbgrün mit Energie; als Akzent oder als mutige Front.',
    material: 'quartz',
    reason: 'Ein ruhiger heller Quarzkomposit gibt dem kräftigen Gelbgrün Raum.',
  },
  {
    id: 'persimmon',
    name: 'Persimmon',
    hex: '#FF5C34',
    mood: 'Wärme, die bleibt.',
    description: 'Lebendiges Rotorange, kombiniert mit ruhigen Materialien.',
    material: 'granite',
    reason: 'Grauer Granit schafft ein mineralisches Gegengewicht zum warmen Orange.',
  },
] as const;
export const MATERIALS = [
  {
    id: 'granite',
    name: 'Granit',
    subtitle: 'Naturstein · jedes Stück anders',
    min: 400,
    max: 1000,
    thickness: '20–30 mm',
    position: '0%',
    description:
      'Natürliche Körnung und individuelle Zeichnung. Pflege und Imprägnierung mit dem Steinlieferanten abstimmen.',
    prompt: 'natural grey granite with subtle fine mineral speckles',
  },
  {
    id: 'quartz',
    name: 'Quarzkomposit',
    subtitle: 'Ruhige Optik · vielfältige Dekore',
    min: 600,
    max: 1200,
    thickness: '20–30 mm',
    position: '50%',
    description:
      'Gleichmässige Dekore und viele Farbvarianten. Hitzebeständigkeit ist produktabhängig; Untersetzer einplanen.',
    prompt: 'warm ivory quartz composite with delicate small mineral speckles',
  },
  {
    id: 'ceramic',
    name: 'Keramik',
    subtitle: 'Feine Kanten · klare Materialität',
    min: 700,
    max: 1400,
    thickness: '12–20 mm',
    position: '100%',
    description:
      'Schlanke Materialwirkung, viele Oberflächen. Kanten, Ausschnitte und Einbau mit dem Fachbetrieb prüfen.',
    prompt: 'dark graphite porcelain ceramic with fine restrained light organic veining',
  },
] as const;
export type ColorId = (typeof COLORS)[number]['id'];
export type MaterialId = (typeof MATERIALS)[number]['id'];
export const colorById = (id: ColorId) => COLORS.find((c) => c.id === id)!;
export const materialById = (id: MaterialId) => MATERIALS.find((m) => m.id === id)!;
