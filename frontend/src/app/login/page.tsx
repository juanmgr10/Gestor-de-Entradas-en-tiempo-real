'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { Suspense, useEffect, useState, type FormEvent } from 'react';
import { useAuth } from '@/components/AuthProvider';
import { ApiError } from '@/lib/api';

type Mode = 'login' | 'register';

// Solo rutas internas, para evitar redirecciones abiertas
const safeNext = (value: string | null) => (value && value.startsWith('/') && !value.startsWith('//') ? value : '/');

function LoginForm() {
  const { user, ready, login, register } = useAuth();
  const router = useRouter();
  const next = safeNext(useSearchParams().get('next'));

  const [mode, setMode] = useState<Mode>('login');
  const [name, setName] = useState('');
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [sending, setSending] = useState(false);

  useEffect(() => {
    if (ready && user) router.replace(next);
  }, [ready, user, router, next]);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setSending(true);
    setError(null);
    try {
      if (mode === 'login') await login(username.trim(), password);
      else await register({ name: name.trim(), username: username.trim(), email: email.trim(), password });
    } catch (err) {
      setError(err instanceof ApiError ? [err.message, ...err.details].join(' · ') : 'Error inesperado');
    } finally {
      setSending(false);
    }
  }

  const switchMode = (m: Mode) => {
    setMode(m);
    setError(null);
  };

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
