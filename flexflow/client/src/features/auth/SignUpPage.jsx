import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useApp } from '@/context/AppContext.jsx';
import { Button } from '@/components/ui/Button.jsx';
import { getErrorMessage } from '@/services/api/index.js';

const inputClass =
  'mt-1 w-full rounded-xl bg-black/35 border border-white/10 px-3 py-2 text-sm text-slate-100 placeholder:text-slate-600 focus:border-indigo-400/40 focus:ring-1 focus:ring-indigo-500/25 outline-none transition-colors';

const labelClass = 'text-xs uppercase tracking-wide text-slate-500 block mb-0.5';

function normalizeUsername(s) {
  return String(s || '')
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9_]/g, '');
}

export function SignUpPage() {
  const navigate = useNavigate();
  const { user, loading, register } = useApp();
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [name, setName] = useState('');
  const [grade, setGrade] = useState('10');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!loading && user) navigate('/', { replace: true });
  }, [loading, user, navigate]);

  const onSubmit = async (e) => {
    e.preventDefault();
    const u = normalizeUsername(username);
    if (!/^[a-z0-9_]{3,32}$/.test(u)) {
      alert(
        'Username must be 3–32 characters: lowercase letters, numbers, underscores.'
      );
      return;
    }
    if (password.length < 8) {
      alert('Password must be at least 8 characters.');
      return;
    }
    if (password !== confirm) {
      alert('Passwords do not match.');
      return;
    }
    const digits = phone.replace(/\D/g, '');
    if (digits.length < 10) {
      alert('Phone must include at least 10 digits.');
      return;
    }
    setSubmitting(true);
    try {
      await register({
        username: u,
        email: email.trim(),
        phone: phone.trim(),
        name: name.trim(),
        grade,
        password,
      });
      navigate('/', { replace: true });
    } catch (err) {
      alert(getErrorMessage(err));
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
          Create your account
        </h1>
        <p className="text-sm text-slate-400 mb-6">
          Username, email, and phone help you sign in and recover access later.
        </p>
        <form onSubmit={onSubmit} className="space-y-3">
          <label className="block text-sm text-slate-300">
            <span className={labelClass}>Username</span>
            <input
              className={inputClass}
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="e.g. alex_study"
              autoComplete="username"
              required
            />
            <span className="text-[11px] text-slate-600 mt-1 block">
              Lowercase letters, numbers, underscores · 3–32 characters
            </span>
          </label>
          <label className="block text-sm text-slate-300">
            <span className={labelClass}>Full name</span>
            <input
              className={inputClass}
              value={name}
              onChange={(e) => setName(e.target.value)}
              autoComplete="name"
              required
            />
          </label>
          <label className="block text-sm text-slate-300">
            <span className={labelClass}>Email</span>
            <input
              type="email"
              className={inputClass}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="email"
              required
            />
          </label>
          <label className="block text-sm text-slate-300">
            <span className={labelClass}>Phone</span>
            <input
              type="tel"
              className={inputClass}
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              autoComplete="tel"
              required
            />
          </label>
          <label className="block text-sm text-slate-300">
            <span className={labelClass}>Grade (optional)</span>
            <select
              className={inputClass}
              value={grade}
              onChange={(e) => setGrade(e.target.value)}
            >
              {['9', '10', '11', '12'].map((g) => (
                <option key={g} value={g}>
                  Grade {g}
                </option>
              ))}
            </select>
          </label>
          <label className="block text-sm text-slate-300">
            <span className={labelClass}>Password</span>
            <input
              type="password"
              className={inputClass}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="new-password"
              required
            />
          </label>
          <label className="block text-sm text-slate-300">
            <span className={labelClass}>Confirm password</span>
            <input
              type="password"
              className={inputClass}
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              autoComplete="new-password"
              required
            />
          </label>
          <Button
            variant="primary"
            size="lg"
            type="submit"
            className="w-full mt-2"
            disabled={submitting}
          >
            {submitting ? 'Creating account…' : 'Sign up'}
          </Button>
        </form>
        <p className="mt-6 text-center text-sm text-slate-400">
          Already have an account?{' '}
          <Link
            to="/login"
            className="text-indigo-300 hover:text-indigo-200 font-medium"
          >
            Sign in
          </Link>
        </p>
      </motion.div>
    </div>
  );
}
