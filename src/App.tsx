import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type ChangeEvent,
  type CSSProperties,
} from 'react';
import {
  ArrowDownToLine,
  ArrowLeft,
  ArrowRight,
  Camera,
  Check,
  ChevronRight,
  CircleHelp,
  Columns2,
  ExternalLink,
  FolderOpen,
  ImagePlus,
  Layers3,
  LoaderCircle,
  Maximize2,
  Plus,
  Save,
  ShieldCheck,
  SlidersHorizontal,
  Sparkles,
  Trash2,
  Upload,
} from 'lucide-react';
import type { User } from '@netlify/identity';
import {
  COLORS,
  MATERIALS,
  RESEARCH_DATE,
  SOURCES,
  colorById,
  materialById,
  type MaterialId,
} from './data';
import {
  createProject,
  estimate,
  formatCHF,
  isRasterDataUrl,
  parseLength,
  parseProject,
  type Project,
  type Variant,
} from './domain';
import { deleteProject, listProjects, saveProject } from './storage';
import { downloadFile, preparePhoto, safeName } from './files';
import { Dialog } from './Dialog';
import { Auth } from './Auth';

type Modal =
  | null
  | 'photo'
  | 'projects'
  | 'materials'
  | 'sources'
  | 'privacy'
  | 'export'
  | 'generate'
  | 'present';
const price = (material: MaterialId, length: string) => {
  const p = estimate(material, length);
  return p ? `CHF ${formatCHF(p.min)}–${formatCHF(p.max)}` : 'Länge noch offen';
};
function Texture({ material, className = '' }: { material: MaterialId; className?: string }) {
  return (
    <span
      aria-hidden="true"
      className={`texture ${className}`}
      style={{ backgroundPosition: `${materialById(material).position} center` }}
    />
  );
}
function SourceLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <a href={href} target="_blank" rel="noreferrer">
      {children}
      <ExternalLink size={12} />
    </a>
  );
}

export default function App() {
  const [project, setProject] = useState<Project>(() => createProject(true));
  const [dirty, setDirty] = useState(false);
  const [modal, setModal] = useState<Modal>(null);
  const [toast, setToast] = useState('');
  const [busy, setBusy] = useState(false);
  const [saved, setSaved] = useState<Project[]>([]);
  const [loadingProjects, setLoadingProjects] = useState(false);
  const [view, setView] = useState<'split' | 'before' | 'after'>('split');
  const [split, setSplit] = useState(42);
  const [ready, setReady] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [consent, setConsent] = useState(false);
  const [generateError, setGenerateError] = useState('');
  const [pair, setPair] = useState<[number, number]>([0, 1]);
  const uploadRef = useRef<HTMLInputElement>(null);
  const cameraRef = useRef<HTMLInputElement>(null);
  const importRef = useRef<HTMLInputElement>(null);
  const generationLock = useRef(false);
  const color = colorById(project.color);
  const material = materialById(project.material);
  const active = project.variants.find((v) => v.id === project.activeId);
  const selectionChanged =
    !!active &&
    (active.color !== project.color ||
      active.material !== project.material ||
      active.notes !== project.notes);
  const total = estimate(project.material, project.length);
  const invalidLength = project.length !== '' && parseLength(project.length) === null;
  const authChanged = useCallback((u: User | null) => setUser(u), []);
  function notify(message: string) {
    setToast(message);
  }
  function change(patch: Partial<Project>) {
    setProject((p) => ({ ...p, ...patch, updatedAt: new Date().toISOString() }));
    setDirty(true);
  }
  function replace(p: Project) {
    setProject(p);
    setDirty(false);
    setModal(null);
    setView('split');
  }
  function mayReplace() {
    return (
      !dirty ||
      window.confirm(
        'Ungespeicherte Änderungen verwerfen? Zuerst lokal speichern, wenn du sie behalten möchtest.',
      )
    );
  }
  useEffect(() => {
    const controller = new AbortController();
    fetch('/api/status', { signal: controller.signal })
      .then((r) => (r.ok ? r.json() : null))
      .then((s) => setReady(s?.ready === true))
      .catch(() => {});
    return () => controller.abort();
  }, []);
  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(''), 6500);
    return () => clearTimeout(t);
  }, [toast]);
  useEffect(() => {
    const handler = (e: BeforeUnloadEvent) => {
      if (dirty || busy) {
        e.preventDefault();
        e.returnValue = '';
      }
    };
    window.addEventListener('beforeunload', handler);
    return () => window.removeEventListener('beforeunload', handler);
  }, [dirty, busy]);
  async function save() {
    if (invalidLength) {
      notify('Bitte die Abdeckungslänge korrigieren oder leer lassen.');
      return;
    }
    try {
      await saveProject(project);
      setDirty(false);
      notify('Projekt auf diesem Gerät gespeichert.');
    } catch (e) {
      notify((e as Error).message);
    }
  }
  async function openProjects() {
    setModal('projects');
    setLoadingProjects(true);
    try {
      setSaved(await listProjects());
    } catch (e) {
      notify((e as Error).message);
    } finally {
      setLoadingProjects(false);
    }
  }
  async function upload(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    if (!mayReplace()) return;
    setBusy(true);
    try {
      const photo = await preparePhoto(file);
      const fresh = createProject();
      fresh.photo = photo;
      replace(fresh);
      setDirty(true);
      notify('Foto vorbereitet. Es bleibt lokal, bis du die KI-Übertragung bestätigst.');
    } catch (error) {
      notify((error as Error).message);
    } finally {
      setBusy(false);
    }
  }
  async function importProject(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file || !mayReplace()) return;
    try {
      if (file.size > 32 * 1024 * 1024) throw new Error('Projektdatei ist grösser als 32 MB.');
      const p = parseProject(JSON.parse(await file.text()));
      p.id = crypto.randomUUID();
      p.updatedAt = new Date().toISOString();
      replace(p);
      setDirty(true);
      notify('Projekt importiert. Zum Behalten lokal speichern.');
    } catch {
      notify('Import fehlgeschlagen. Bitte eine gültige KÜCHE-90-Projektdatei bis 32 MB wählen.');
    }
  }
  function selectVariant(v: Variant) {
    change({
      activeId: v.id,
      color: v.color,
      material: v.material,
      notes: v.notes,
      length: v.length,
    });
    setView('split');
  }
  function exportProject() {
    try {
      downloadFile(
        JSON.stringify(parseProject(project)),
        `${safeName(project.title)}.kueche90.json`,
      );
      notify('Projektdatei exportiert. Sie enthält Fotos – bitte vertraulich behandeln.');
    } catch {
      notify(
        'Bitte einen Projektnamen und eine gültige Länge eingeben; die Länge darf leer bleiben.',
      );
    }
  }
  async function generate() {
    if (
      generationLock.current ||
      !consent ||
      !project.photo ||
      project.demo ||
      !ready ||
      !user ||
      invalidLength
    )
      return;
    generationLock.current = true;
    setBusy(true);
    setGenerateError('');
    const snapshot = { ...project };
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 58_000);
    try {
      const response = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'same-origin',
        signal: controller.signal,
        body: JSON.stringify({
          photo: snapshot.photo,
          color: snapshot.color,
          material: snapshot.material,
          notes: snapshot.notes,
          consent: true,
        }),
      });
      const result = await response.json().catch(() => null);
      if (!response.ok)
        throw new Error(
          result?.error || 'Die Generierung ist nicht verfügbar. Bitte später erneut versuchen.',
        );
      if (!isRasterDataUrl(result?.image))
        throw new Error('Die KI hat kein gültiges Bild zurückgegeben.');
      const variant: Variant = {
        id: crypto.randomUUID(),
        color: snapshot.color,
        material: snapshot.material,
        image: result.image,
        createdAt: new Date().toISOString(),
        demo: false,
        notes: snapshot.notes,
        length: snapshot.length,
      };
      setProject((p) => ({
        ...p,
        variants: [...p.variants, variant],
        activeId: variant.id,
        updatedAt: variant.createdAt,
      }));
      setDirty(true);
      setView('split');
      setModal(null);
      notify('Entwurf erstellt. Bitte Raumdetails und Machbarkeit mit dem Projektleiter prüfen.');
    } catch (e) {
      setGenerateError(
        (e as Error).name === 'AbortError'
          ? 'Die Zeitlimite wurde erreicht. Es ist kein Bild gespeichert; beim Anbieter können trotzdem Kosten entstanden sein.'
          : (e as Error).message,
      );
    } finally {
      clearTimeout(timer);
      generationLock.current = false;
      setBusy(false);
    }
  }
  const canGenerate =
    ready &&
    !!user &&
    !project.demo &&
    !!project.photo &&
    project.variants.length < 6 &&
    !invalidLength;

  return (
    <>
      <a href="#workspace" className="skip-link">
        Zum Arbeitsbereich
      </a>
      <header className="topbar">
        <a
          href="/"
          className="brand"
          onClick={(e) => {
            e.preventDefault();
            if (mayReplace()) replace(createProject(true));
          }}
          aria-label="Küche 90 – Beispielprojekt"
        >
          <span className="brand-mark">⌜</span>
          <span>
            KÜCHE<span className="brand-number">90</span>
          </span>
        </a>
        <span className="pilot-label">INTERNER PILOT</span>
        <nav aria-label="Hauptnavigation">
          <button onClick={openProjects}>
            <FolderOpen size={16} /> Projekte
          </button>
          <button onClick={() => setModal('materials')}>
            <Layers3 size={16} /> Materialbibliothek
          </button>
        </nav>
        <Auth ready={ready} changed={authChanged} />
      </header>
      <div className="app-shell">
        <aside className="rail">
          <div className="rail-caption">
            VOM RAUM
            <br />
            ZUR IDEE.
          </div>
          <nav aria-label="Entwurfsschritte">
            <button onClick={() => setModal('photo')}>
              <span className="step-number">01</span>
              <Camera />
              <span>
                Raumfoto<small>Der Ausgangspunkt</small>
              </span>
              {project.photo && <Check className="step-check" size={15} />}
            </button>
            <a href="#color-section">
              <span className="step-number">02</span>
              <SlidersHorizontal />
              <span>
                Farbwelt<small>Deine Richtung</small>
              </span>
              <Check className="step-check" size={15} />
            </a>
            <a href="#material-section">
              <span className="step-number">03</span>
              <Layers3 />
              <span>
                Material<small>Zum Anfassen gedacht</small>
              </span>
              <Check className="step-check" size={15} />
            </a>
            <button
              className="current"
              onClick={() =>
                document
                  .getElementById('concept-section')
                  ?.scrollIntoView({ behavior: 'auto', block: 'center' })
              }
            >
              <span className="step-number">04</span>
              <Sparkles />
              <span>
                Dein Entwurf<small>Die Idee wird sichtbar</small>
              </span>
            </button>
          </nav>
          <div className="rail-bottom">
            <span className="outline-90">
              90<span>%</span>
            </span>
            <p>
              Die Vision beginnt hier.
              <br />
              Den Feinschliff macht ihr.
            </p>
            <button onClick={() => setModal('privacy')}>
              <ShieldCheck size={15} /> Lokal & bewusst
            </button>
          </div>
        </aside>
        <main id="workspace" className="workspace">
          <h1 className="visually-hidden">KÜCHE 90 – {project.title}</h1>
          <div className="page-heading">
            <div>
              <div className="eyebrow">DEIN KÜCHENKONZEPT</div>
              <div className="title-line">
                <input
                  aria-label="Projektname"
                  value={project.title}
                  maxLength={100}
                  onChange={(e) => change({ title: e.target.value })}
                  onBlur={() => {
                    if (!project.title.trim()) change({ title: 'Neues Küchenprojekt' });
                  }}
                />
                <span className="badge">
                  {project.demo ? 'BEISPIELPROJEKT' : 'EIGENES PROJEKT'}
                </span>
              </div>
              <p>Ein Raum. Deine Handschrift. Ein erster Blick auf das Mögliche.</p>
            </div>
            <button
              className="button secondary new-project"
              disabled={busy}
              onClick={() => {
                if (mayReplace()) {
                  replace(createProject());
                  setModal('photo');
                }
              }}
            >
              <Plus size={17} /> Neues Projekt
            </button>
          </div>
          <div className="workspace-grid">
            <div className="canvas-column">
              <section id="color-section" className="color-section" aria-labelledby="color-heading">
                <div className="section-heading">
                  <h2 id="color-heading">
                    <span>01</span> Deine Farbwelt
                  </h2>
                  <button className="source-chip" onClick={() => setModal('sources')}>
                    <span className="pinterest-p">P</span> Pinterest Palette 2026{' '}
                    <ExternalLink size={12} />
                  </button>
                </div>
                <div className="swatches" role="group" aria-label="Frontfarbe auswählen">
                  {COLORS.map((c) => (
                    <button
                      key={c.id}
                      aria-pressed={project.color === c.id}
                      onClick={() => change({ color: c.id })}
                      className={`swatch ${project.color === c.id ? 'selected' : ''}`}
                      style={{ '--swatch': c.hex } as CSSProperties}
                    >
                      <span className="swatch-color">
                        {project.color === c.id && (
                          <span className="swatch-check">
                            <Check size={14} />
                          </span>
                        )}
                      </span>
                      <span>{c.name}</span>
                    </button>
                  ))}
                </div>
                <div className="palette-note">
                  <strong>{color.mood}</strong>
                  <span>Kuratierte Jahrespalette · kein Live-Trendfeed</span>
                </div>
              </section>
              <section
                className="concept-section"
                id="concept-section"
                aria-labelledby="concept-heading"
              >
                <div className="section-heading">
                  <h2 id="concept-heading">
                    <span>02</span> Dein Raum, neu gedacht
                  </h2>
                  <div className="view-switch" aria-label="Bildansicht">
                    {(
                      [
                        ['before', 'Original'],
                        ['split', 'Vergleich'],
                        ['after', 'Entwurf'],
                      ] as const
                    ).map(([id, label]) => (
                      <button
                        key={id}
                        aria-pressed={view === id}
                        disabled={id !== 'before' && !active}
                        onClick={() => setView(id)}
                      >
                        {label}
                      </button>
                    ))}
                  </div>
                </div>
                <div className={`comparison ${project.photo ? '' : 'empty'}`}>
                  {project.photo ? (
                    <>
                      <img
                        className="base-image"
                        src={view === 'before' || !active ? project.photo : active.image}
                        alt={
                          view === 'before' || !active
                            ? 'Ursprünglicher Raum'
                            : `KI-Konzept: ${colorById(active.color).name} mit ${materialById(active.material).name}`
                        }
                      />
                      {view === 'split' && active && (
                        <img
                          className="before-image"
                          src={project.photo}
                          alt="Ursprünglicher Raum im direkten Vergleich"
                          style={{ clipPath: `inset(0 ${100 - split}% 0 0)` }}
                        />
                      )}
                      <span className="image-tag left">
                        {view === 'after' && active ? 'KI-KONZEPT' : 'ORIGINAL'}
                      </span>
                      {view === 'split' && active && (
                        <span className="image-tag right">KI-KONZEPT</span>
                      )}
                      {view === 'split' && active && (
                        <>
                          <div className="split-divider" style={{ left: `${split}%` }}>
                            <span>
                              <ArrowLeft size={13} />
                              <ArrowRight size={13} />
                            </span>
                          </div>
                          <input
                            className="split-range"
                            type="range"
                            min="4"
                            max="96"
                            value={split}
                            aria-label="Vorher-Nachher-Vergleich verschieben"
                            onChange={(e) => setSplit(Number(e.target.value))}
                          />
                        </>
                      )}
                      <span className="image-credit">
                        {project.demo
                          ? 'Fiktiver Raum · KI-generiertes Beispiel'
                          : active && view !== 'before'
                            ? 'KI-Visualisierung · nicht massstabsgetreu'
                            : 'Dein Foto · lokal vorbereitet'}
                      </span>
                      <button
                        className="expand-button"
                        aria-label="Kundenansicht öffnen"
                        disabled={!active}
                        onClick={() => {
                          setPair([
                            Math.max(
                              0,
                              project.variants.findIndex((v) => v.id === active?.id),
                            ),
                            project.variants.length > 1 ? 1 : 0,
                          ]);
                          setModal('present');
                        }}
                      >
                        <Maximize2 size={17} />
                      </button>
                    </>
                  ) : (
                    <div className="empty-state">
                      <ImagePlus size={42} />
                      <h3>Hier beginnt deine Küche.</h3>
                      <p>
                        Ein Foto vom Raum oder der bestehenden Küche genügt für den ersten Schritt.
                      </p>
                      <button className="button primary" onClick={() => setModal('photo')}>
                        <Plus size={16} /> Raumfoto hinzufügen
                      </button>
                    </div>
                  )}
                </div>
                {selectionChanged ? (
                  <p className="selection-warning">
                    <span /> Auswahl geändert. Das Bild zeigt noch{' '}
                    {active && colorById(active.color).name} /{' '}
                    {active && materialById(active.material).name}. Für deine neue Auswahl einen
                    Entwurf generieren.
                  </p>
                ) : (
                  <div className="image-footnote">
                    <span>
                      <ShieldCheck size={14} /> Visuelle Idee, keine Ausführungsplanung
                    </span>
                    <button onClick={() => setModal('photo')} disabled={busy}>
                      <Camera size={14} /> Raumfoto ändern
                    </button>
                  </div>
                )}
              </section>
              <section className="variants-section" aria-labelledby="variant-heading">
                <div className="section-heading">
                  <h2 id="variant-heading">
                    Deine Varianten <span className="count">{project.variants.length}/6</span>
                  </h2>
                  <button
                    className="text-button"
                    disabled={!active}
                    onClick={() => {
                      setPair([0, project.variants.length > 1 ? 1 : 0]);
                      setModal('present');
                    }}
                  >
                    <Columns2 size={15} /> Kundenansicht <ArrowRight size={15} />
                  </button>
                </div>
                <div className="variant-list">
                  {project.variants.map((v, i) => (
                    <button
                      key={v.id}
                      aria-pressed={v.id === project.activeId}
                      className={`variant ${v.id === project.activeId ? 'active' : ''}`}
                      onClick={() => selectVariant(v)}
                    >
                      <img src={v.image} alt="" />
                      <span>
                        <small>
                          VARIANTE {String(i + 1).padStart(2, '0')}
                          {v.demo ? ' · DEMO' : ''}
                        </small>
                        <strong>{colorById(v.color).name}</strong>
                        <em>{materialById(v.material).name}</em>
                      </span>
                      {v.id === project.activeId && (
                        <span className="variant-check">
                          <Check size={13} />
                        </span>
                      )}
                    </button>
                  ))}
                  <button
                    className="add-variant"
                    disabled={project.variants.length >= 6 || busy}
                    onClick={() => {
                      setGenerateError('');
                      setConsent(false);
                      setModal('generate');
                    }}
                  >
                    <Plus size={21} />
                    <span>Neue Variante</span>
                  </button>
                </div>
              </section>
            </div>
            <aside id="material-section" className="inspector" aria-labelledby="material-heading">
              <div className="inspector-heading">
                <span className="eyebrow">DIE DETAILS MACHEN DEN RAUM</span>
                <h2 id="material-heading">Material & Abdeckung</h2>
              </div>
              <div className="recommendation">
                <Sparkles size={16} />
                <div>
                  <strong>Passend zu {color.name}</strong>
                  <p>{color.reason}</p>
                  <button onClick={() => change({ material: color.material })}>
                    Vorschlag übernehmen <ArrowRight size={13} />
                  </button>
                </div>
              </div>
              <div className="material-options" role="group" aria-label="Abdeckung auswählen">
                {MATERIALS.map((m) => (
                  <button
                    className={`material-option ${m.id === project.material ? 'selected' : ''}`}
                    key={m.id}
                    aria-pressed={m.id === project.material}
                    onClick={() => change({ material: m.id })}
                  >
                    <Texture material={m.id} />
                    <span>
                      <strong>{m.name}</strong>
                      <small>
                        CHF {formatCHF(m.min)}–{formatCHF(m.max)} / lfm
                      </small>
                    </span>
                    <span className="radio-mark">{m.id === project.material && <span />}</span>
                  </button>
                ))}
              </div>
              <div className="material-detail">
                <Texture material={material.id} className="large-texture" />
                <div>
                  <strong>{material.name}</strong>
                  <span>Richtdicke {material.thickness}</span>
                </div>
                <p>{material.description}</p>
                <small>Illustrative Muster, keine Lieferantendekore.</small>
              </div>
              <div className="cost-card">
                <div className="cost-label">
                  <h3>Preisindikation</h3>
                  <span>NUR ABDECKUNG</span>
                </div>
                <label className="length-field" htmlFor="length">
                  Geplante Länge <span>optional</span>
                </label>
                <div className="input-unit">
                  <input
                    id="length"
                    inputMode="decimal"
                    placeholder="z. B. 4,0"
                    value={project.length}
                    maxLength={8}
                    aria-invalid={invalidLength}
                    aria-describedby="length-help"
                    onChange={(e) => change({ length: e.target.value })}
                  />
                  <span>lfm</span>
                </div>
                <p id="length-help" className={invalidLength ? 'field-error' : 'tiny'}>
                  {invalidLength
                    ? 'Bitte eine Länge zwischen 0,01 und 30 m eingeben.'
                    : 'Laufmeter bei 60 cm Tiefe · manuelle Annahme'}
                </p>
                <div className="price-value">
                  {total ? (
                    <>
                      CHF {formatCHF(total.min)}
                      <span>–{formatCHF(total.max)}</span>
                    </>
                  ) : (
                    <>
                      CHF {formatCHF(material.min)}
                      <span>–{formatCHF(material.max)} / lfm</span>
                    </>
                  )}
                </div>
                <p className="tiny">
                  {total
                    ? `Bandbreite für ${total.length.toLocaleString('de-CH')} lfm. `
                    : 'Ohne Länge wird kein Gesamtpreis berechnet. '}
                  Keine Offerte; nicht der Preis der gesamten Küche.
                </p>
                <button className="source-button" onClick={() => setModal('sources')}>
                  Berechnungsgrundlage & Quellen <CircleHelp size={13} />
                </button>
              </div>
              <label className="notes-label">
                Was ist dir wichtig?
                <textarea
                  value={project.notes}
                  maxLength={1000}
                  onChange={(e) => change({ notes: e.target.value })}
                  placeholder="Zum Beispiel: offene Regale, schwarze Griffe …"
                  rows={2}
                />
              </label>
              <button
                className="button primary generate-button"
                disabled={busy || project.variants.length >= 6}
                onClick={() => {
                  setConsent(false);
                  setGenerateError('');
                  setModal('generate');
                }}
              >
                {busy ? <LoaderCircle className="spin" size={18} /> : <Sparkles size={18} />}{' '}
                {busy ? 'Bitte warten …' : 'Entwurf generieren'}
                <ArrowRight size={17} />
              </button>
              <div className="status-note">
                <span className={ready ? 'online-dot' : 'offline-dot'} />
                {ready
                  ? 'KI eingerichtet · Team-Zugang erforderlich'
                  : 'Demo bereit · KI noch nicht freigeschaltet'}
              </div>
              <div className="save-actions">
                <button className="button secondary" disabled={busy} onClick={save}>
                  <Save size={15} /> Lokal speichern
                  {dirty && <span className="unsaved" aria-label="Ungespeicherte Änderungen" />}
                </button>
                <button
                  className="icon-button bordered"
                  disabled={busy}
                  onClick={() => setModal('export')}
                  aria-label="Projekt exportieren"
                >
                  <ArrowDownToLine size={18} />
                </button>
              </div>
              <p className="device-note">Auf diesem Gerät. Ohne Cloud-Projektablage.</p>
            </aside>
          </div>
          <footer className="footer">
            <span>
              KÜCHE90 <span>Die erste Vision. Gemeinsam fertig gedacht.</span>
            </span>
            <div>
              <button onClick={() => setModal('sources')}>Quellen & Grenzen</button>
              <button onClick={() => setModal('privacy')}>Datenschutz im Pilot</button>
              <span>v0.1</span>
            </div>
          </footer>
        </main>
      </div>
      <input
        ref={uploadRef}
        type="file"
        hidden
        accept="image/jpeg,image/png,image/webp"
        onChange={upload}
      />
      <input
        ref={cameraRef}
        type="file"
        hidden
        accept="image/jpeg,image/png,image/webp"
        capture="environment"
        onChange={upload}
      />
      <input
        ref={importRef}
        type="file"
        hidden
        accept="application/json,.json"
        onChange={importProject}
      />
      <div className="toast" role="status" aria-live="polite" hidden={!toast}>
        <Check size={17} />
        {toast}
        <button onClick={() => setToast('')} aria-label="Meldung schliessen">
          ×
        </button>
      </div>
      {modal === 'photo' && (
        <Dialog title="Zeig uns deinen Raum." close={() => !busy && setModal(null)}>
          <p className="muted">
            Fotografiere die Wand oder Küche möglichst frontal. Fenster, Türen, Decke und Boden
            sollten gut sichtbar sein.
          </p>
          <div className="upload-zone">
            <ImagePlus size={36} />
            <h3>Ein Foto. Viele Möglichkeiten.</h3>
            <p>
              JPG, PNG oder WebP · bis 12 MB
              <br />
              HEIC bitte zuvor in JPG umwandeln.
            </p>
            <button
              className="button primary"
              disabled={busy}
              onClick={() => uploadRef.current?.click()}
            >
              <Upload size={17} />
              {busy ? 'Foto wird vorbereitet …' : 'Foto auswählen'}
            </button>
            <button
              className="button secondary"
              disabled={busy}
              onClick={() => cameraRef.current?.click()}
            >
              <Camera size={17} /> Foto aufnehmen
            </button>
          </div>
          <p className="tiny">
            <ShieldCheck size={14} /> Das Foto bleibt zunächst auf deinem Gerät. Personen, Adressen
            und vertrauliche Details bitte nicht aufnehmen. Standortmetadaten werden beim
            Vorbereiten entfernt.
          </p>
          <button
            className="text-button"
            disabled={busy}
            onClick={() => {
              if (mayReplace()) replace(createProject(true));
            }}
          >
            Beispielprojekt erkunden <ArrowRight size={15} />
          </button>
        </Dialog>
      )}
      {modal === 'projects' && (
        <Dialog title="Deine lokalen Projekte" close={() => setModal(null)}>
          <p className="muted">
            Nur in diesem Browser gespeichert. Ein Browser-Reset kann die Ablage löschen – wichtige
            Projekte zusätzlich exportieren.
          </p>
          {loadingProjects ? (
            <p>Projekte werden geladen …</p>
          ) : saved.length === 0 ? (
            <div className="empty-projects">
              <FolderOpen size={32} />
              <h3>Noch ganz viel Raum.</h3>
              <p>Speichere deinen ersten Entwurf mit «Lokal speichern».</p>
            </div>
          ) : (
            <div className="project-list">
              {saved.map((p) => (
                <div key={p.id} className="project-row">
                  <button
                    onClick={() => {
                      if (mayReplace()) replace(p);
                    }}
                  >
                    {p.photo && (
                      <img
                        src={p.variants.find((v) => v.id === p.activeId)?.image || p.photo}
                        alt=""
                      />
                    )}
                    <span>
                      <strong>{p.title}</strong>
                      <small>
                        {p.variants.length} Varianten ·{' '}
                        {new Date(p.updatedAt).toLocaleDateString('de-CH')}
                      </small>
                    </span>
                    <ChevronRight size={17} />
                  </button>
                  <button
                    className="icon-button"
                    aria-label={`${p.title} lokal löschen`}
                    onClick={async () => {
                      if (
                        !window.confirm(
                          `«${p.title}» vom Gerät löschen? Exportierte Dateien bleiben erhalten.`,
                        )
                      )
                        return;
                      try {
                        await deleteProject(p.id);
                        setSaved((s) => s.filter((x) => x.id !== p.id));
                        notify(
                          'Lokales Projekt gelöscht. Vorhandene Exportdateien bleiben erhalten.',
                        );
                      } catch (e) {
                        notify((e as Error).message);
                      }
                    }}
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              ))}
            </div>
          )}
          <button className="button secondary" onClick={() => importRef.current?.click()}>
            <Upload size={16} /> Projektdatei importieren
          </button>
        </Dialog>
      )}
      {modal === 'materials' && (
        <Dialog title="Materialbibliothek" wide close={() => setModal(null)}>
          <p className="muted">
            Drei Materialfamilien für den ersten Entwurf. Illustrative Muster, keine bestellbaren
            Produkte. Preisstand {RESEARCH_DATE}.
          </p>
          <div className="material-library">
            {MATERIALS.map((m) => (
              <article key={m.id}>
                <Texture material={m.id} className="library-texture" />
                <h3>{m.name}</h3>
                <p>{m.subtitle}</p>
                <strong>
                  CHF {formatCHF(m.min)}–{formatCHF(m.max)} / lfm
                </strong>
                <p>{m.description}</p>
                <button
                  className="button secondary"
                  onClick={() => {
                    change({ material: m.id });
                    setModal(null);
                  }}
                >
                  Material auswählen <ArrowRight size={15} />
                </button>
              </article>
            ))}
          </div>
          <SourceLink href={SOURCES.prices}>Öffentliche Preisquelle</SourceLink>
        </Dialog>
      )}
      {modal === 'sources' && (
        <Dialog title="Transparent von der Idee bis zum Preis" close={() => setModal(null)} wide>
          <div className="source-grid">
            <section>
              <span className="eyebrow">INSPIRATION</span>
              <h3>Pinterest Palette 2026</h3>
              <p>
                Die fünf Farben stammen aus der offiziellen Jahrespalette. Diese App zeigt eine
                redaktionell kuratierte Momentaufnahme, keine aktuellen Pins, Suchvolumen oder
                Live-Ranglisten.
              </p>
              <p>
                Materialempfehlungen und Küchenbilder sind unsere gestalterischen Vorschläge, keine
                Empfehlungen von Pinterest.
              </p>
              <SourceLink href={SOURCES.trends}>Pinterest Newsroom · 14.01.2026</SourceLink>
            </section>
            <section>
              <span className="eyebrow">PREISINDIKATION</span>
              <h3>Eine nachvollziehbare Bandbreite</h3>
              <p>
                Granit CHF 400–1’000, Quarzkomposit CHF 600–1’200 und Keramik CHF 700–1’400 pro
                Laufmeter bei 60 cm Tiefe. Quelle: HMA Interior, 24.05.2026.
              </p>
              <p>
                Die Quelle bezeichnet die Tabellenwerte als inklusive Standardmontage. Ausschnitte,
                besondere Kanten, Transport, Rückwand und weitere Leistungen separat prüfen.
                Steuerumfang und konkrete Ausführung durch eine Lieferantenofferte klären.
              </p>
              <SourceLink href={SOURCES.prices}>HMA Interior · Materialvergleich</SourceLink>
            </section>
            <section>
              <span className="eyebrow">RECHENWEG</span>
              <h3>Laufmeter × Materialbandbreite</h3>
              <p>
                Die Länge gibst du selbst ein. Aus dem Foto werden keine Masse abgeleitet. Ohne
                Länge siehst du nur den Einheitspreis. Möbel, Geräte, Sanitär, Elektro, Demontage
                und weitere Küchenleistungen sind nicht enthalten.
              </p>
              <p>
                Ein zusätzlicher Marktvergleich: IKEA Keramik nach Mass CHF 649–749/m². Diese andere
                Einheit wird nicht in unsere Laufmeterberechnung gemischt.
              </p>
              <SourceLink href={SOURCES.benchmark}>IKEA Schweiz · Keramik</SourceLink>
            </section>
            <section>
              <span className="eyebrow">GRENZEN DES PILOTEN</span>
              <h3>Ein Gesprächseinstieg, kein Bauplan.</h3>
              <p>
                «90» steht für den gewünschten ersten Wurf, nicht für garantierte 90 % Genauigkeit.
                KI kann Geometrie, Anschlüsse oder Geräte falsch darstellen. Masse, Ergonomie,
                Sicherheit, Technik und Budget prüft der Projektleiter vor einer verbindlichen
                Planung.
              </p>
              <p>
                Recherchestand: {RESEARCH_DATE}. Marktpreise ändern sich. Materialeigenschaften sind
                produktabhängig.
              </p>
              <SourceLink href={SOURCES.properties}>Sanitas Troesch · Arbeitsflächen</SourceLink>
            </section>
          </div>
        </Dialog>
      )}
      {modal === 'privacy' && (
        <Dialog title="Lokal & bewusst" close={() => setModal(null)}>
          <div className="stack">
            <p>
              Fotos und Projekte werden nur nach «Lokal speichern» in der lokalen Browser-Datenbank
              abgelegt. Es gibt keine Cloud-Projektablage, keine Analyse- oder Werbetracker in
              dieser App.
            </p>
            <p>
              Für einen KI-Entwurf werden das vorbereitete Foto, die Farbauswahl, das Material und
              deine Notiz nach deiner Bestätigung an die Netlify-Funktion und den konfigurierten
              Google-Bilddienst übermittelt. Projektname und Länge werden nicht mitgesendet. Die App
              selbst speichert auf dem Server keine Bilder; die Anbieter haben eigene Verarbeitungs-
              und Aufbewahrungsbedingungen.
            </p>
            <p>
              Netlify verarbeitet beim Hosting technisch erforderliche Verbindungsdaten. Für
              Team-Login werden Konto- und Sitzungsdaten verwendet. Die App setzt keine öffentliche
              Registrierung ein.
            </p>
            <p>
              Nur Fotos verwenden, für die du die nötigen Rechte und die Zustimmung zur
              KI-Verarbeitung hast. Projektdateien enthalten Fotos und sind vertraulich zu
              behandeln.
            </p>
            <p className="notice">
              Vor einem Kundenrollout muss der Betreiber Verantwortlichkeit, Anbieterbedingungen,
              Datenschutzerklärung und Freigabeprozess ergänzen. Dieser Pilot ist keine vollständige
              Datenschutzerklärung.
            </p>
            <button className="button secondary" onClick={openProjects}>
              <FolderOpen size={16} /> Lokale Projekte verwalten
            </button>
          </div>
        </Dialog>
      )}
      {modal === 'export' && (
        <Dialog title="Bereit für das nächste Gespräch." close={() => setModal(null)}>
          <div className="stack">
            <p className="muted">
              Übergib die Idee mit ihren Annahmen. Preise und Bild sind unverbindlich; der
              Projektleiter übernimmt die technische Ausarbeitung.
            </p>
            <button className="export-option" onClick={exportProject}>
              <ArrowDownToLine />
              <span>
                <strong>Projektdatei herunterladen</strong>
                <small>JSON mit Fotos, Varianten und Auswahl · wieder importierbar</small>
              </span>
              <ChevronRight />
            </button>
            <button
              className="export-option"
              disabled={!active}
              onClick={() => {
                setModal(null);
                setTimeout(() => window.print(), 100);
              }}
            >
              <Layers3 />
              <span>
                <strong>Projektblatt drucken / als PDF sichern</strong>
                <small>Aktiver Bildentwurf, Preisbasis und Planungs-Checkliste</small>
              </span>
              <ChevronRight />
            </button>
            <p className="tiny">
              PDF wird über den Druckdialog deines Browsers erstellt. Die Projektdatei enthält
              vertrauliche Bilder.
            </p>
          </div>
        </Dialog>
      )}
      {modal === 'generate' && (
        <Dialog
          title="Aus einer Idee wird ein Bild."
          close={() => {
            if (!busy) setModal(null);
          }}
        >
          <div className="stack">
            <p>
              <strong>
                {color.name} × {material.name}
              </strong>
              <br />
              <span className="muted">
                Ein neuer fotorealistischer Konzeptentwurf auf Basis deines Raumfotos.
              </span>
            </p>
            {project.demo ? (
              <p className="notice">
                Du siehst ein fiktives Beispielprojekt. Für einen eigenen Entwurf zuerst dein
                Raumfoto hinzufügen. Die Beispielbilder passen sich nicht automatisch an eine neue
                Auswahl an.
              </p>
            ) : !project.photo ? (
              <p className="notice">Bitte zuerst ein Raumfoto hinzufügen.</p>
            ) : null}
            {!ready && (
              <p className="notice">
                Die Live-KI ist noch nicht freigeschaltet. In Netlify müssen AI Gateway, Identity,
                Team-Freigabe und KUECHE90_ENABLE_AI eingerichtet werden. Anleitung: README im
                Repository.
              </p>
            )}
            {ready && !user && (
              <p className="notice">
                Bitte über «Team-Login» anmelden. Es gibt keine öffentliche Registrierung.
              </p>
            )}
            {project.variants.length >= 6 && (
              <p className="notice">
                Maximal sechs Varianten pro Projekt. Für weitere Entwürfe ein neues Projekt
                beginnen.
              </p>
            )}
            {invalidLength && (
              <p className="notice">Bitte die Länge korrigieren oder leer lassen.</p>
            )}
            {canGenerate && (
              <>
                <label className="checkbox">
                  <input
                    type="checkbox"
                    checked={consent}
                    onChange={(e) => setConsent(e.target.checked)}
                    disabled={busy}
                  />
                  <span>
                    Ich darf dieses Foto verwenden und bestätige die Übertragung an Netlify und
                    Google zur KI-Bilderzeugung.
                  </span>
                </label>
                <p className="tiny">
                  Eine Generierung kann kostenpflichtig sein und bis zu einer Minute dauern. Keine
                  automatische Wiederholung. Ohne Erfolg können trotzdem Anbieterkosten entstehen.
                </p>
              </>
            )}
            {busy && (
              <p role="status" className="notice">
                <LoaderCircle className="spin" size={16} /> Dein Entwurf wird erstellt. Bitte dieses
                Fenster geöffnet lassen.
              </p>
            )}
            {generateError && (
              <p className="field-error" role="alert">
                {generateError}
              </p>
            )}
            {project.demo || !project.photo ? (
              <button className="button primary" onClick={() => setModal('photo')}>
                <Camera size={17} /> Eigenes Raumfoto hinzufügen
              </button>
            ) : (
              <button
                className="button primary"
                disabled={!canGenerate || !consent || busy}
                onClick={generate}
              >
                {busy ? <LoaderCircle className="spin" size={18} /> : <Sparkles size={18} />}{' '}
                {busy ? 'Entwurf entsteht …' : 'Jetzt kostenpflichtig generieren'}
              </button>
            )}
          </div>
        </Dialog>
      )}
      {modal === 'present' && active && (
        <Dialog title="Welche Küche fühlt sich nach dir an?" wide dark close={() => setModal(null)}>
          <p className="presentation-subtitle">
            {project.title} · {project.demo ? 'Fiktive Beispielvarianten' : 'KI-Konzeptvarianten'} ·
            gemeinsam weiterdenken
          </p>
          <div className="presentation-grid">
            {pair.slice(0, project.variants.length > 1 ? 2 : 1).map((index, side) => {
              const v = project.variants[index] || active;
              return (
                <article key={side}>
                  <img
                    src={v.image}
                    alt={`${colorById(v.color).name} mit ${materialById(v.material).name}`}
                  />
                  <label>
                    Variante {side + 1}
                    <select
                      aria-label={`Vergleichsvariante ${side + 1}`}
                      value={v.id}
                      onChange={(e) =>
                        setPair(
                          (old) =>
                            old.map((n, i) =>
                              i === side
                                ? project.variants.findIndex((x) => x.id === e.target.value)
                                : n,
                            ) as [number, number],
                        )
                      }
                    >
                      {project.variants.map((x) => (
                        <option value={x.id} key={x.id}>
                          {colorById(x.color).name} · {materialById(x.material).name}
                        </option>
                      ))}
                    </select>
                  </label>
                  <div className="presentation-price">
                    <span>Abdeckung{v.length ? ` · ${v.length} lfm` : ''}</span>
                    <strong>{price(v.material, v.length)}</strong>
                  </div>
                  <button
                    className="button secondary"
                    onClick={() => {
                      selectVariant(v);
                      setModal(null);
                    }}
                  >
                    Mit dieser Variante weiterarbeiten <ArrowRight size={15} />
                  </button>
                </article>
              );
            })}
          </div>
          <p className="presentation-disclaimer">
            Unverbindliche Visualisierungen, nicht massstabsgetreu. Preisbandbreiten nur für die
            Abdeckung. Alle Masse, Anschlüsse und Ausführungsdetails sind vor Ort zu prüfen.
          </p>
        </Dialog>
      )}
      <section className="print-sheet" aria-label="Projektblatt">
        <div className="print-brand">
          KÜCHE90 <span>PROJEKTBLATT · UNVERBINDLICHER VORENTWURF</span>
        </div>
        <h1>{project.title}</h1>
        {active && (
          <>
            <img src={active.image} alt="Aktiver Küchenentwurf" />
            <h2>
              {colorById(active.color).name} × {materialById(active.material).name}
            </h2>
            <p>
              {active.demo ? 'Fiktives KI-Beispiel.' : 'KI-generierter Konzeptentwurf.'} Nicht
              massstabsgetreu. Erstellt: {new Date(active.createdAt).toLocaleDateString('de-CH')}
            </p>
            <p>
              <strong>Abdeckung: {price(active.material, active.length)}</strong> ·{' '}
              {active.length || 'unbekannte'} lfm bei 60 cm Tiefe. Länge manuell angenommen.
            </p>
            <p>{active.notes || 'Keine zusätzlichen Gestaltungswünsche erfasst.'}</p>
          </>
        )}
        <p>
          Nur Abdeckung, keine Gesamtküche. Unverbindliche Marktbandbreite inkl. Standardmontage
          laut Quelle; Sonderleistungen und Steuerumfang per Lieferantenofferte prüfen. Quelle: HMA
          Interior, Materialvergleich vom 24.05.2026. Recherchestand {RESEARCH_DATE}.
        </p>
        <p className="print-url">{SOURCES.prices}</p>
        <h3>Mit dem Projektleiter klären</h3>
        <p>
          ☐ Masse & Raumgeometrie &nbsp; ☐ Fenster & Türen &nbsp; ☐ Wasser & Elektro
          <br />☐ Geräte & Lüftung &nbsp; ☐ Materialmuster &nbsp; ☐ Montageumfang & Budget
        </p>
        <p>
          «90» ist eine Zielvorstellung, keine Genauigkeitsgarantie. Keine Ausführungsplanung oder
          Offerte.
        </p>
      </section>
    </>
  );
}
