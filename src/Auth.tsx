import { useEffect, useState, type FormEvent } from 'react';
import {
  acceptInvite,
  getUser,
  handleAuthCallback,
  login,
  logout,
  onAuthChange,
  requestPasswordRecovery,
  updateUser,
  type User,
} from '@netlify/identity';
import { LogIn, LogOut } from 'lucide-react';
import { Dialog } from './Dialog';

export function Auth({ ready, changed }: { ready: boolean; changed: (user: User | null) => void }) {
  const [user, setUser] = useState<User | null>(null);
  const [open, setOpen] = useState(false);
  const [mode, setMode] = useState<'login' | 'invite' | 'recovery' | 'forgot'>('login');
  const [token, setToken] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [message, setMessage] = useState('');
  const [busy, setBusy] = useState(false);
  useEffect(() => {
    const unsub = onAuthChange((_event, current) => {
      setUser(current);
      changed(current);
    });
    let active = true;
    async function init() {
      try {
        const callback = await handleAuthCallback();
        if (!active) return;
        if (callback?.type === 'invite') {
          setToken(callback.token || '');
          setMode('invite');
          setOpen(true);
        }
        if (callback?.type === 'recovery') {
          setMode('recovery');
          setOpen(true);
        }
        if (ready || callback) {
          const current = await getUser();
          if (active) {
            setUser(current);
            changed(current);
          }
        }
      } catch {
        if (active)
          setMessage('Anmeldung ist hier noch nicht eingerichtet oder der Link ist abgelaufen.');
      }
    }
    void init();
    return () => {
      active = false;
      unsub();
    };
  }, [ready, changed]);
  async function submit(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setMessage('');
    try {
      if (mode === 'forgot') {
        await requestPasswordRecovery(email);
        setMessage('Falls ein Konto existiert, erhältst du einen Link per E-Mail.');
      } else {
        if (mode === 'invite') await acceptInvite(token, password);
        else if (mode === 'recovery') await updateUser({ password });
        else await login(email, password);
        setPassword('');
        setOpen(false);
        setMode('login');
      }
    } catch {
      setMessage(
        'Das hat nicht geklappt. Zugangsdaten, Einladung und Netlify-Identity-Einrichtung prüfen.',
      );
    } finally {
      setBusy(false);
    }
  }
  return (
    <>
      <button className="header-login" onClick={() => setOpen(true)}>
        <span className="avatar">
          {user ? user.email?.[0]?.toUpperCase() || 'P' : <LogIn size={15} />}
        </span>
        <span>{user ? 'Mein Zugang' : 'Team-Login'}</span>
      </button>
      {open && (
        <Dialog
          title={
            user && mode !== 'recovery'
              ? 'Dein Pilot-Zugang'
              : mode === 'invite'
                ? 'Einladung annehmen'
                : mode === 'recovery'
                  ? 'Neues Passwort'
                  : 'Willkommen im Studio'
          }
          close={() => {
            if (!busy) {
              setOpen(false);
              setPassword('');
            }
          }}
        >
          {user && mode !== 'recovery' ? (
            <>
              <p>Angemeldet als {user.email}.</p>
              <p className="muted">
                Die serverseitige Team-Freigabe entscheidet zusätzlich, wer Bilder generieren darf.
              </p>
              <button
                className="button"
                onClick={async () => {
                  try {
                    await logout();
                    setOpen(false);
                  } catch {
                    setMessage('Abmelden fehlgeschlagen. Bitte erneut versuchen.');
                  }
                }}
              >
                <LogOut size={17} /> Abmelden
              </button>
            </>
          ) : (
            <form onSubmit={submit} className="stack">
              <p className="muted">
                Interner Pilot · Zugang nur auf Einladung. Beispielprojekt und lokale Ablage
                funktionieren auch ohne Anmeldung.
              </p>
              {!ready && (
                <p className="notice">
                  Die KI ist noch nicht freigeschaltet. Die Einrichtung ist in der README
                  beschrieben.
                </p>
              )}
              {(mode === 'login' || mode === 'forgot') && (
                <label>
                  E-Mail
                  <input
                    type="email"
                    autoComplete="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </label>
              )}
              {mode !== 'forgot' && (
                <label>
                  Passwort
                  <input
                    type="password"
                    autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
                    minLength={mode === 'login' ? 1 : 12}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                </label>
              )}
              <button className="button primary" disabled={busy}>
                {busy
                  ? 'Einen Moment …'
                  : mode === 'forgot'
                    ? 'Passwort-Link anfordern'
                    : mode === 'login'
                      ? 'Anmelden'
                      : 'Passwort speichern'}
              </button>
              {mode === 'login' && (
                <button type="button" className="text-button" onClick={() => setMode('forgot')}>
                  Passwort vergessen?
                </button>
              )}
              {mode === 'forgot' && (
                <button type="button" className="text-button" onClick={() => setMode('login')}>
                  Zur Anmeldung
                </button>
              )}
            </form>
          )}
          {message && (
            <p role="status" className="notice">
              {message}
            </p>
          )}
        </Dialog>
      )}
    </>
  );
}
