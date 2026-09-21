import { test, afterEach } from 'node:test';
import assert from 'node:assert/strict';
import { JSDOM } from 'jsdom';
import { indexedDB } from 'fake-indexeddb';

// Component-level DOM tests, not a browser/visual test. Network and dialogs are mocked.
const dom = new JSDOM('<!doctype html><html><body></body></html>', {
  url: 'https://pilot.example/',
});
for (const key of [
  'window',
  'document',
  'HTMLElement',
  'HTMLDialogElement',
  'HTMLInputElement',
  'HTMLButtonElement',
  'HTMLTextAreaElement',
  'Event',
  'MouseEvent',
  'Node',
  'MutationObserver',
  'File',
  'FileReader',
  'DOMException',
]) {
  Object.defineProperty(globalThis, key, {
    value: (dom.window as unknown as Record<string, unknown>)[key],
    configurable: true,
    writable: true,
  });
}
Object.defineProperty(globalThis, 'navigator', { value: dom.window.navigator, configurable: true });
Object.defineProperty(globalThis, 'location', { value: dom.window.location, configurable: true });
Object.assign(globalThis, {
  indexedDB,
  IS_REACT_ACT_ENVIRONMENT: true,
  fetch: async () => Response.json({ ready: false }),
});
dom.window.HTMLDialogElement.prototype.showModal = function () {
  this.setAttribute('open', '');
};
dom.window.HTMLDialogElement.prototype.close = function () {
  this.removeAttribute('open');
};
dom.window.confirm = () => true;
const React = await import('react');
const { render, screen, cleanup, fireEvent, waitFor } = await import('@testing-library/react');
const userEvent = (await import('@testing-library/user-event')).default;
const { default: App } = await import('../src/App');
afterEach(() => cleanup());

test('initial workspace labels demo, source and price honestly', async () => {
  render(React.createElement(App));
  assert.ok(screen.getByText('BEISPIELPROJEKT'));
  assert.ok(screen.getByText('Kuratierte Jahrespalette · kein Live-Trendfeed'));
  assert.ok(screen.getByText('Demo bereit · KI noch nicht freigeschaltet'));
  assert.equal(screen.getByLabelText('Geplante Länge optional').getAttribute('value'), '4,0');
});
test('changing colour marks existing image as stale; recommendation changes material only', async () => {
  render(React.createElement(App));
  const user = userEvent.setup({ document: dom.window.document });
  await user.click(screen.getByRole('button', { name: 'Plum Noir' }));
  assert.ok(screen.getByText(/Auswahl geändert. Das Bild zeigt noch Jade \/ Granit/));
  await user.click(screen.getByRole('button', { name: /Vorschlag übernehmen/ }));
  assert.equal(
    screen.getByRole('button', { name: /Keramik.*CHF/ }).getAttribute('aria-pressed'),
    'true',
  );
  assert.ok(screen.getByAltText('KI-Konzept: Jade mit Granit'));
});
test('length validation never fabricates a total', async () => {
  render(React.createElement(App));
  const length = screen.getByLabelText('Geplante Länge optional');
  fireEvent.change(length, { target: { value: '-5' } });
  assert.equal(length.getAttribute('aria-invalid'), 'true');
  assert.ok(screen.getByText('Bitte eine Länge zwischen 0,01 und 30 m eingeben.'));
  fireEvent.change(length, { target: { value: '' } });
  assert.ok(screen.getByText(/Ohne Länge wird kein Gesamtpreis berechnet/));
});
test('comparison is keyboard-operable; variant restores its exact metadata', async () => {
  render(React.createElement(App));
  const user = userEvent.setup({ document: dom.window.document });
  const slider = screen.getByRole('slider', { name: 'Vorher-Nachher-Vergleich verschieben' });
  assert.equal(slider.getAttribute('type'), 'range');
  fireEvent.change(slider, { target: { value: '65' } });
  assert.equal((slider as HTMLInputElement).value, '65');
  await user.click(screen.getByRole('button', { name: /VARIANTE 02.*Plum Noir/ }));
  assert.equal(
    screen.getByRole('button', { name: 'Plum Noir' }).getAttribute('aria-pressed'),
    'true',
  );
  assert.ok(screen.getByAltText('KI-Konzept: Plum Noir mit Keramik'));
});
test('disabled AI does not pretend to generate a photo; customer view and close work', async () => {
  render(React.createElement(App));
  const user = userEvent.setup({ document: dom.window.document });
  await user.click(screen.getByRole('button', { name: 'Entwurf generieren' }));
  assert.ok(screen.getByRole('dialog'));
  assert.ok(screen.getByText(/Du siehst ein fiktives Beispielprojekt/));
  assert.equal(screen.queryByRole('button', { name: 'Jetzt kostenpflichtig generieren' }), null);
  await user.click(screen.getByRole('button', { name: 'Dialog schliessen' }));
  await user.click(screen.getByRole('button', { name: 'Kundenansicht' }));
  assert.ok(screen.getByRole('combobox', { name: 'Vergleichsvariante 1' }));
  assert.ok(screen.getByRole('combobox', { name: 'Vergleichsvariante 2' }));
});
test('project save, list and restore use local IndexedDB', async () => {
  render(React.createElement(App));
  const user = userEvent.setup({ document: dom.window.document });
  fireEvent.change(screen.getByRole('textbox', { name: 'Projektname' }), {
    target: { value: 'Testküche Zürich' },
  });
  await user.click(screen.getByRole('button', { name: /Lokal speichern/ }));
  await waitFor(() => assert.ok(screen.getByText('Projekt auf diesem Gerät gespeichert.')));
  await user.click(screen.getByRole('button', { name: 'Projekte' }));
  await waitFor(() =>
    assert.ok(screen.getByRole('button', { name: /Testküche Zürich.*Varianten/ })),
  );
  await user.click(screen.getByRole('button', { name: /Testküche Zürich.*Varianten/ }));
  assert.equal(
    (screen.getByRole('textbox', { name: 'Projektname' }) as HTMLInputElement).value,
    'Testküche Zürich',
  );
});
test('new project clears demo assets and offers local upload', async () => {
  render(React.createElement(App));
  const user = userEvent.setup({ document: dom.window.document });
  await user.click(screen.getByRole('button', { name: 'Neues Projekt' }));
  assert.ok(screen.getByText('EIGENES PROJEKT'));
  assert.ok(screen.getByRole('button', { name: 'Foto auswählen' }));
  assert.equal(screen.queryByAltText('KI-Konzept: Jade mit Granit'), null);
  assert.equal((screen.getByLabelText('Geplante Länge optional') as HTMLInputElement).value, '');
});
