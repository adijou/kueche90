import { COLORS, MATERIALS, type ColorId, type MaterialId } from './data';

export type Variant = {
  id: string;
  color: ColorId;
  material: MaterialId;
  image: string;
  createdAt: string;
  demo: boolean;
  notes: string;
  length: string;
};
export type Project = {
  schema: 1;
  id: string;
  title: string;
  photo: string | null;
  demo: boolean;
  color: ColorId;
  material: MaterialId;
  length: string;
  notes: string;
  variants: Variant[];
  activeId: string | null;
  updatedAt: string;
};
export const DEMO_ASSETS = ['/images/room.webp', '/images/jade.webp', '/images/plum.webp'];
export function createProject(demo = false): Project {
  const now = new Date().toISOString();
  return {
    schema: 1,
    id: crypto.randomUUID(),
    title: demo ? 'Studio Jade' : 'Neues Küchenprojekt',
    photo: demo ? '/images/room.webp' : null,
    demo,
    color: 'jade',
    material: 'granite',
    length: demo ? '4,0' : '',
    notes: '',
    updatedAt: now,
    activeId: demo ? 'demo-jade' : null,
    variants: demo
      ? [
          {
            id: 'demo-jade',
            color: 'jade',
            material: 'granite',
            image: '/images/jade.webp',
            createdAt: now,
            demo: true,
            notes: '',
            length: '4,0',
          },
          {
            id: 'demo-plum',
            color: 'plum',
            material: 'ceramic',
            image: '/images/plum.webp',
            createdAt: now,
            demo: true,
            notes: '',
            length: '4,0',
          },
        ]
      : [],
  };
}
export const formatCHF = (n: number) =>
  new Intl.NumberFormat('de-CH', { maximumFractionDigits: 0 }).format(n);
export function parseLength(value: string): number | null {
  const v = value.trim().replace(',', '.');
  if (!/^\d{1,2}(\.\d{1,2})?$/.test(v)) return null;
  const n = Number(v);
  return n > 0 && n <= 30 ? n : null;
}
export function estimate(material: MaterialId, length: string) {
  const n = parseLength(length);
  const m = MATERIALS.find((item) => item.id === material);
  return n && m ? { min: Math.round(m.min * n), max: Math.round(m.max * n), length: n } : null;
}
export function isRasterDataUrl(value: unknown, max = 4_200_000): value is string {
  return (
    typeof value === 'string' &&
    value.length <= max &&
    /^data:image\/(png|jpeg|webp);base64,[A-Za-z0-9+/]+={0,2}$/.test(value)
  );
}
function validImage(value: unknown): value is string {
  return typeof value === 'string' && (DEMO_ASSETS.includes(value) || isRasterDataUrl(value));
}
const validColor = (v: unknown): v is ColorId => COLORS.some((c) => c.id === v);
const validMaterial = (v: unknown): v is MaterialId => MATERIALS.some((m) => m.id === v);
const shortString = (v: unknown, max: number): v is string =>
  typeof v === 'string' && v.length <= max;
const validDate = (v: unknown): v is string => shortString(v, 40) && Number.isFinite(Date.parse(v));
// Never render imported URLs or HTML. Only fixed bundled assets and raster data are accepted.
export function parseProject(raw: unknown): Project {
  if (!raw || typeof raw !== 'object') throw new Error('Keine gültige Projektdatei.');
  const p = raw as Record<string, unknown>;
  if (
    p.schema !== 1 ||
    !shortString(p.id, 80) ||
    !p.id ||
    !shortString(p.title, 100) ||
    !p.title.trim() ||
    typeof p.demo !== 'boolean' ||
    (p.photo !== null && !validImage(p.photo)) ||
    !validColor(p.color) ||
    !validMaterial(p.material) ||
    !shortString(p.length, 8) ||
    (p.length !== '' && parseLength(p.length) === null) ||
    !shortString(p.notes, 1000) ||
    !validDate(p.updatedAt) ||
    !Array.isArray(p.variants) ||
    p.variants.length > 6
  ) {
    throw new Error('Projektdatei ist beschädigt oder hat ein unbekanntes Format.');
  }
  const variants: Variant[] = p.variants.map((v: unknown) => {
    if (!v || typeof v !== 'object') throw new Error('Ungültige Variante.');
    const a = v as Record<string, unknown>;
    if (
      !shortString(a.id, 80) ||
      !a.id ||
      !validColor(a.color) ||
      !validMaterial(a.material) ||
      !validImage(a.image) ||
      !validDate(a.createdAt) ||
      typeof a.demo !== 'boolean' ||
      !shortString(a.notes, 1000) ||
      !shortString(a.length, 8) ||
      (a.length !== '' && parseLength(a.length) === null)
    )
      throw new Error('Ungültige Variante.');
    if (a.demo !== p.demo || (!a.demo && !isRasterDataUrl(a.image)))
      throw new Error('Unstimmiger Bildtyp.');
    return {
      id: a.id,
      color: a.color,
      material: a.material,
      image: a.image,
      createdAt: a.createdAt,
      demo: a.demo,
      notes: a.notes,
      length: a.length,
    };
  });
  if (
    new Set(variants.map((v) => v.id)).size !== variants.length ||
    (variants.length > 0 && !p.photo) ||
    (p.activeId !== null && !variants.some((v) => v.id === p.activeId)) ||
    (!p.demo && p.photo !== null && !isRasterDataUrl(p.photo))
  )
    throw new Error('Unstimmige Projektverweise.');
  return {
    schema: 1,
    id: p.id,
    title: p.title,
    photo: p.photo as string | null,
    demo: p.demo,
    color: p.color,
    material: p.material,
    length: p.length,
    notes: p.notes,
    variants,
    activeId: p.activeId as string | null,
    updatedAt: p.updatedAt,
  };
}
