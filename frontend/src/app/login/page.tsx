'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { Suspense, useEffect, useState, type FormEvent } from 'react';
import { useAuth } from '@/components/AuthProvider';
import { ApiError } from '@/lib/api';
import { useCountdown } from '@/hooks/useCountdown';

type Mode = 'login' | 'register' | 'verify';

// Espera mínima entre reenvíos del código (la misma que aplica el servidor)
const RESEND_COOLDOWN_MS = 60_000;

// Solo rutas internas, para evitar redirecciones abiertas
const safeNext = (value: string | null) => (value && value.startsWith('/') && !value.startsWith('//') ? value : '/');

function LoginForm() {
  const { user, ready, login, register, verifyEmail, resendCode } = useAuth();
  const router = useRouter();
  const next = safeNext(useSearchParams().get('next'));

  const [mode, setMode] = useState<Mode>('login');
  const [name, setName] = useState('');
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [sending, setSending] = useState(false);
  // Cuenta pendiente de verificar y momento a partir del cual se puede reenviar el código
  const [pending, setPending] = useState<{ username: string; email?: string } | null>(null);
  const [code, setCode] = useState('');
  const [notice, setNotice] = useState<string | null>(null);
  const [resendAt, setResendAt] = useState<string | null>(null);
  const resendIn = useCountdown(resendAt);

  useEffect(() => {
    if (ready && user) router.replace(next);
  }, [ready, user, router, next]);

  const showError = (err: unknown) =>
    setError(err instanceof ApiError ? [err.message, ...err.details].join(' · ') : 'Error inesperado');

  const startVerification = (account: { username: string; email?: string }, codeSent: boolean) => {
    setPending(account);
    setCode('');
    setMode('verify');
    if (codeSent) setResendAt(new Date(Date.now() + RESEND_COOLDOWN_MS).toISOString());
  };

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setSending(true);
    setError(null);
    setNotice(null);
    try {
      if (mode === 'login') {
        await login(username.trim(), password);
      } else if (mode === 'register') {
        const res = await register({ name: name.trim(), username: username.trim(), email: email.trim(), password });
        startVerification(res.user, true);
      } else if (pending) {
        await verifyEmail(pending.username, code);
      }
    } catch (err) {
      // Cuenta sin verificar: se pasa a la pantalla del código y se pide uno nuevo
      if (mode === 'login' && err instanceof ApiError && err.status === 403) {
        startVerification({ username: username.trim() }, false);
        await handleResend(username.trim());
      } else {
        showError(err);
      }
    } finally {
      setSending(false);
    }
  }

  async function handleResend(account = pending?.username) {
    if (!account) return;
    setError(null);
    try {
      await resendCode(account);
      setNotice('Te enviamos un código nuevo.');
      setResendAt(new Date(Date.now() + RESEND_COOLDOWN_MS).toISOString());
    } catch (err) {
      // 429: ya hay un código reciente; el usuario puede usarlo o esperar
      if (!(err instanceof ApiError && err.status === 429)) showError(err);
      else setNotice(err.message);
    }
  }

  const switchMode = (m: Mode) => {
    setMode(m);
    setError(null);
    setNotice(null);
  };

  if (mode === 'verify' && pending) {
    return (
      <div className="auth">
        <div className="panel auth__card">
          <h2>Verifica tu correo</h2>
          <p className="muted">
            Te enviamos un código de 4 dígitos {pending.email ? <>a <strong>{pending.email}</strong></> : 'a tu correo'}.
            Vence en 10 minutos.
          </p>
          <form onSubmit={handleSubmit}>
            <label className="field">
              <span>Código</span>
              <input
                value={code}
                onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 4))}
                required
                inputMode="numeric"
                pattern="\d{4}"
                maxLength={4}
                autoComplete="one-time-code"
                autoFocus
                title="4 dígitos"
              />
            </label>
            {notice && <p className="muted">{notice}</p>}
            {error && <p className="error-text">{error}</p>}
            <button type="submit" className="button button--primary button--block" disabled={sending || code.length !== 4}>
              {sending ? 'Verificando…' : 'Verificar'}
            </button>
          </form>
          <p className="muted">
            ¿No te llegó? Revisa la carpeta de spam o{' '}
            <button type="button" className="link-button" onClick={() => handleResend()} disabled={resendIn > 0}>
              {resendIn > 0 ? `reenvía el código en ${resendIn} s` : 'reenvía el código'}
            </button>
            .
          </p>
          <button type="button" className="button button--ghost button--block" onClick={() => switchMode('login')}>
            Volver
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="auth">
      <div className="panel auth__card">
        <div className="tabs" role="tablist">
          <button type="button" role="tab" aria-selected={mode === 'login'} className={`tab${mode === 'login' ? ' tab--active' : ''}`} onClick={() => switchMode('login')}>
            Iniciar sesión
          </button>
          <button type="button" role="tab" aria-selected={mode === 'register'} className={`tab${mode === 'register' ? ' tab--active' : ''}`} onClick={() => switchMode('register')}>
            Crear cuenta
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          {mode === 'register' && (
            <label className="field">
              <span>Nombre</span>
              <input value={name} onChange={(e) => setName(e.target.value)} required maxLength={100} autoComplete="name" />
            </label>
          )}
          <label className="field">
            <span>Usuario</span>
            <input
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
              minLength={mode === 'register' ? 3 : 1}
              maxLength={30}
              pattern={mode === 'register' ? '[a-zA-Z0-9._\\-]{3,30}' : undefined}
              title="De 3 a 30 caracteres: letras, números, punto, guion o guion bajo"
              autoComplete="username"
              autoCapitalize="none"
              spellCheck={false}
            />
            {mode === 'register' && <small className="muted">Letras, números, punto, guion o guion bajo.</small>}
          </label>
          {mode === 'register' && (
            <label className="field">
              <span>Email</span>
              <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required maxLength={150} autoComplete="email" />
            </label>
          )}
          <label className="field">
            <span>Contraseña</span>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={mode === 'register' ? 8 : 1}
              maxLength={72}
              autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
            />
            {mode === 'register' && <small className="muted">Mínimo 8 caracteres.</small>}
          </label>
          {error && <p className="error-text">{error}</p>}
          <button type="submit" className="button button--primary button--block" disabled={sending}>
            {sending ? 'Procesando…' : mode === 'login' ? 'Entrar' : 'Crear cuenta'}
          </button>
        </form>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<p className="muted">Cargando…</p>}>
      <LoginForm />
    </Suspense>
  );
}
