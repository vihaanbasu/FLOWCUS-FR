import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useApp } from '@/context/AppContext.jsx';
import { Button } from '@/components/ui/Button.jsx';
import { getErrorMessage } from '@/services/api/index.js';
import { ApiError } from '@/services/http/client.js';

const inputClass =
  'mt-1 w-full rounded-xl bg-black/35 border border-white/10 px-3 py-2 text-sm text-slate-100 placeholder:text-slate-600 focus:border-indigo-400/40 focus:ring-1 focus:ring-indigo-500/25 outline-none transition-colors';

export function LoginPage() {
  const navigate = useNavigate();
  const { user, loading, login } = useApp();
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [loginError, setLoginError] = useState('');

  useEffect(() => {
    if (!loading && user) navigate('/', { replace: true });
  }, [loading, user, navigate]);

  const onSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setLoginError('');
    try {
      const cleanIdentifier = identifier.trim();
      if (cleanIdentifier.length < 3 || cleanIdentifier.length > 254) {
        setLoginError('Enter a valid email or username');
        return;
      }
      if (password.length < 8 || password.length > 128) {
        setLoginError('Password format is invalid');
        return;
      }
      await login(cleanIdentifier, password);
      navigate('/', { replace: true });
    } catch (err) {
      if (err instanceof ApiError && err.status === 401) {
        setLoginError('Invalid email, username, or password');
      } else {
        setLoginError(getErrorMessage(err));
      }
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center text-slate-500 text-sm">
        Loading…
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-12">
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md rounded-3xl glass border border-white/15 p-8 shadow-glass"
      >
        <h1 className="font-display text-2xl font-bold tracking-tight mb-1">
          Welcome back
        </h1>
        <p className="text-sm text-slate-400 mb-6">
          Sign in with your email or username.
        </p>
        <form onSubmit={onSubmit} className="space-y-4">
          <label className="block text-sm text-slate-300">
            <span className="text-xs uppercase tracking-wide text-slate-500 block mb-0.5">
              Email or username
            </span>
            <input
              className={inputClass}
              value={identifier}
              onChange={(e) => {
                setIdentifier(e.target.value);
                setLoginError('');
              }}
              autoComplete="username"
              maxLength={254}
              required
            />
          </label>
          <label className="block text-sm text-slate-300">
            <span className="text-xs uppercase tracking-wide text-slate-500">
              Password
            </span>
            <input
              type="password"
              className={inputClass}
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                setLoginError('');
              }}
              autoComplete="current-password"
              maxLength={128}
              required
            />
          </label>
          {loginError ? (
            <p
              className="text-sm text-red-300/90"
              role="alert"
              aria-live="polite"
            >
              {loginError}
            </p>
          ) : null}
          <Button
            variant="primary"
            size="lg"
            type="submit"
            className="w-full"
            disabled={submitting}
          >
            {submitting ? 'Signing in…' : 'Sign in'}
          </Button>
        </form>
        <p className="mt-6 text-center text-sm text-slate-400">
          New here?{' '}
          <Link
            to="/signup"
            className="text-indigo-300 hover:text-indigo-200 font-medium"
          >
            Create an account
          </Link>
        </p>
      </motion.div>
    </div>
  );
}
