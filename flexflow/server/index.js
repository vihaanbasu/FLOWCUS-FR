import express from 'express';
import cors from 'cors';
import { nanoid } from 'nanoid';
import { mutate, readStore } from './store.js';
import { signToken, verifyToken, hashPassword, verifyPassword } from './auth.js';
import {
  buildAssistantInsights,
  replyCoachChat,
} from './assistantEngine.js';

const app = express();
const PORT = process.env.PORT || 3847;

app.use(cors());
app.use(express.json());

function rowUser(u) {
  return {
    id: u.id,
    username: u.username,
    email: u.email,
    phone: u.phone || '',
    name: u.name,
    grade: u.grade,
    wake_time: u.wake_time,
    bed_time: u.bed_time,
    onboarding: JSON.parse(u.onboarding_json || '{}'),
    gamification: JSON.parse(u.gamification_json || '{}'),
  };
}

function blockRow(r) {
  return {
    id: r.id,
    userId: r.user_id,
    day: r.day,
    startMinutes: r.start_minutes,
    endMinutes: r.end_minutes,
    type: r.type,
    title: r.title,
    reminderEnabled: Boolean(r.reminder_enabled),
  };
}

function requireAuth(req, res, next) {
  const h = req.headers.authorization;
  if (!h?.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  try {
    const payload = verifyToken(h.slice(7));
    req.authUserId = payload.sub;
    next();
  } catch {
    return res.status(401).json({ error: 'Invalid or expired session' });
  }
}

function requireUserParam(paramName) {
  return (req, res, next) => {
    if (req.params[paramName] !== req.authUserId) {
      return res.status(403).json({ error: 'Forbidden' });
    }
    next();
  };
}

function normalizeEmail(e) {
  return String(e || '').trim().toLowerCase();
}

function normalizeUsername(u) {
  return String(u || '').trim().toLowerCase();
}

function validateUsername(u) {
  if (!/^[a-z0-9_]{3,32}$/.test(u)) {
    return 'Username must be 3–32 characters: lowercase letters, numbers, underscores';
  }
  return null;
}

function validateEmail(e) {
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e)) {
    return 'Enter a valid email address';
  }
  return null;
}

function validatePhone(p) {
  const digits = String(p || '').replace(/\D/g, '');
  if (digits.length < 10) {
    return 'Phone must include at least 10 digits';
  }
  return null;
}

function findUserByCredential(d, identifier) {
  const key = String(identifier || '').trim().toLowerCase();
  for (const u of Object.values(d.users)) {
    if (!u.password_hash) continue;
    if (u.email === key || u.username === key) return u;
  }
  return null;
}

app.get('/api/health', (_, res) => res.json({ ok: true }));

/** --- Auth --- */
app.post('/api/auth/register', async (req, res) => {
  try {
    const {
      username: rawUser,
      email: rawEmail,
      phone: rawPhone,
      password,
      name: rawName,
      grade = '',
    } = req.body;

    const username = normalizeUsername(rawUser);
    const email = normalizeEmail(rawEmail);
    const phone = String(rawPhone || '').trim();
    const name = String(rawName || '').trim();

    const eu = validateUsername(username);
    if (eu) return res.status(400).json({ error: eu });
    const ee = validateEmail(email);
    if (ee) return res.status(400).json({ error: ee });
    const ep = validatePhone(phone);
    if (ep) return res.status(400).json({ error: ep });
    if (!password || String(password).length < 8) {
      return res.status(400).json({ error: 'Password must be at least 8 characters' });
    }
    if (!name) {
      return res.status(400).json({ error: 'Name is required' });
    }

    const d = readStore();
    for (const u of Object.values(d.users)) {
      if (u.username === username) {
        return res.status(409).json({ error: 'Username already taken' });
      }
      if (normalizeEmail(u.email) === email) {
        return res.status(409).json({ error: 'Email already registered' });
      }
    }

    const id = nanoid();
    const password_hash = await hashPassword(password);
    const row = {
      id,
      username,
      email,
      phone,
      password_hash,
      name,
      grade: String(grade || ''),
      wake_time: '07:00',
      bed_time: '22:30',
      onboarding_json: JSON.stringify({}),
      gamification_json: JSON.stringify({
        studyStreak: 0,
        sleepStreak: 0,
        achievements: [],
      }),
    };

    mutate((store) => {
      store.users[id] = row;
    });

    const token = signToken(id);
    res.status(201).json({ token, user: rowUser(row) });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Registration failed' });
  }
});

app.post('/api/auth/login', async (req, res) => {
  try {
    const { identifier, password } = req.body;
    if (!identifier || !password) {
      return res.status(400).json({ error: 'Email/username and password required' });
    }
    const d = readStore();
    const u = findUserByCredential(d, identifier);
    if (!u) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }
    const ok = await verifyPassword(password, u.password_hash);
    if (!ok) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }
    const token = signToken(u.id);
    res.json({ token, user: rowUser(u) });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Login failed' });
  }
});

app.get('/api/auth/me', requireAuth, (req, res) => {
  const d = readStore();
  const u = d.users[req.authUserId];
  if (!u) return res.status(401).json({ error: 'User not found' });
  res.json(rowUser(u));
});

/** --- Users (self only) --- */
app.get('/api/users/:id', requireAuth, requireUserParam('id'), (req, res) => {
  const d = readStore();
  const u = d.users[req.params.id];
  if (!u) return res.status(404).json({ error: 'User not found' });
  res.json(rowUser(u));
});

app.patch('/api/users/:id', requireAuth, requireUserParam('id'), (req, res) => {
  const { name, grade, wake_time, bed_time, onboarding, gamification } = req.body;
  let updated;
  mutate((d) => {
    const u = d.users[req.params.id];
    if (!u) return;
    const next = {
      name: name !== undefined ? name : u.name,
      grade: grade !== undefined ? grade : u.grade,
      wake_time: wake_time !== undefined ? wake_time : u.wake_time,
      bed_time: bed_time !== undefined ? bed_time : u.bed_time,
      onboarding_json:
        onboarding !== undefined
          ? JSON.stringify(onboarding)
          : u.onboarding_json,
      gamification_json:
        gamification !== undefined
          ? JSON.stringify(gamification)
          : u.gamification_json,
    };
    d.users[req.params.id] = { ...u, ...next };
    updated = d.users[req.params.id];
  });
  if (!updated) return res.status(404).json({ error: 'User not found' });
  res.json(rowUser(updated));
});

/** --- Schedule blocks --- */
app.get(
  '/api/users/:userId/blocks',
  requireAuth,
  requireUserParam('userId'),
  (req, res) => {
    const d = readStore();
    const rows = d.schedule_blocks
      .filter((b) => b.user_id === req.params.userId)
      .sort((a, b) => a.day - b.day || a.start_minutes - b.start_minutes);
    res.json(rows.map(blockRow));
  }
);

app.post(
  '/api/users/:userId/blocks',
  requireAuth,
  requireUserParam('userId'),
  (req, res) => {
    const id = nanoid();
    const {
      day,
      startMinutes,
      endMinutes,
      type,
      title = '',
      reminderEnabled = 0,
    } = req.body;
    const row = {
      id,
      user_id: req.params.userId,
      day,
      start_minutes: startMinutes,
      end_minutes: endMinutes,
      type,
      title,
      reminder_enabled: reminderEnabled ? 1 : 0,
    };
    mutate((d) => {
      d.schedule_blocks.push(row);
    });
    res.status(201).json(blockRow(row));
  }
);

app.put('/api/blocks/:id', requireAuth, (req, res) => {
  const d = readStore();
  const row = d.schedule_blocks.find((b) => b.id === req.params.id);
  if (!row) return res.status(404).json({ error: 'Block not found' });
  if (row.user_id !== req.authUserId) {
    return res.status(403).json({ error: 'Forbidden' });
  }
  const prevSnap = {
    day: row.day,
    start_minutes: row.start_minutes,
    end_minutes: row.end_minutes,
  };
  const {
    day,
    startMinutes,
    endMinutes,
    type,
    title,
    reminderEnabled,
  } = req.body;
  let out;
  mutate((store) => {
    const i = store.schedule_blocks.findIndex((b) => b.id === req.params.id);
    if (i === -1) return;
    const r = store.schedule_blocks[i];
    const next = {
      day: day !== undefined ? day : r.day,
      start_minutes:
        startMinutes !== undefined ? startMinutes : r.start_minutes,
      end_minutes:
        endMinutes !== undefined ? endMinutes : r.end_minutes,
      type: type !== undefined ? type : r.type,
      title: title !== undefined ? title : r.title,
      reminder_enabled:
        reminderEnabled !== undefined
          ? reminderEnabled
            ? 1
            : 0
          : r.reminder_enabled,
    };
    store.schedule_blocks[i] = { ...r, ...next };
    out = store.schedule_blocks[i];
    const moved =
      next.day !== prevSnap.day ||
      next.start_minutes !== prevSnap.start_minutes ||
      next.end_minutes !== prevSnap.end_minutes;
    if (moved) {
      if (!Array.isArray(store.block_activity_log)) {
        store.block_activity_log = [];
      }
      store.block_activity_log.push({
        id: nanoid(),
        user_id: req.authUserId,
        block_id: req.params.id,
        at: new Date().toISOString(),
        type: r.type,
        title: r.title || '',
        prev: prevSnap,
        next: {
          day: next.day,
          start_minutes: next.start_minutes,
          end_minutes: next.end_minutes,
        },
      });
      const cap = 400;
      if (store.block_activity_log.length > cap) {
        store.block_activity_log = store.block_activity_log.slice(-cap);
      }
    }
  });
  if (!out) return res.status(404).json({ error: 'Block not found' });
  res.json(blockRow(out));
});

app.delete('/api/blocks/:id', requireAuth, (req, res) => {
  let found = false;
  mutate((d) => {
    const block = d.schedule_blocks.find((b) => b.id === req.params.id);
    if (!block || block.user_id !== req.authUserId) return;
    d.reminders = d.reminders.filter((r) => r.block_id !== req.params.id);
    const n = d.schedule_blocks.filter((b) => b.id !== req.params.id);
    if (n.length !== d.schedule_blocks.length) found = true;
    d.schedule_blocks = n;
  });
  if (!found) return res.status(404).json({ error: 'Block not found' });
  res.json({ ok: true });
});

app.delete(
  '/api/users/:userId/blocks',
  requireAuth,
  requireUserParam('userId'),
  (req, res) => {
    mutate((d) => {
      d.schedule_blocks = d.schedule_blocks.filter(
        (b) => b.user_id !== req.params.userId
      );
    });
    res.json({ ok: true });
  }
);

app.post(
  '/api/users/:userId/blocks/bulk',
  requireAuth,
  requireUserParam('userId'),
  (req, res) => {
    const { blocks } = req.body;
    if (!Array.isArray(blocks)) {
      return res.status(400).json({ error: 'blocks array required' });
    }
    const uid = req.params.userId;
    mutate((d) => {
      for (const b of blocks) {
        d.schedule_blocks.push({
          id: b.id || nanoid(),
          user_id: uid,
          day: b.day,
          start_minutes: b.startMinutes,
          end_minutes: b.endMinutes,
          type: b.type,
          title: b.title || '',
          reminder_enabled: b.reminderEnabled ? 1 : 0,
        });
      }
    });
    const d = readStore();
    const rows = d.schedule_blocks
      .filter((b) => b.user_id === uid)
      .sort((a, b) => a.day - b.day || a.start_minutes - b.start_minutes);
    res.json(rows.map(blockRow));
  }
);

app.get(
  '/api/users/:userId/reminders',
  requireAuth,
  requireUserParam('userId'),
  (req, res) => {
    const d = readStore();
    const rows = d.reminders.filter((r) => r.user_id === req.params.userId);
    res.json(
      rows.map((r) => ({
        id: r.id,
        userId: r.user_id,
        blockId: r.block_id,
        notificationTime: r.notification_time,
        label: r.label,
      }))
    );
  }
);

app.post(
  '/api/users/:userId/reminders',
  requireAuth,
  requireUserParam('userId'),
  (req, res) => {
    const id = nanoid();
    const { blockId, notificationTime, label } = req.body;
    const row = {
      id,
      user_id: req.params.userId,
      block_id: blockId || null,
      notification_time: notificationTime,
      label: label || '',
    };
    mutate((d) => {
      d.reminders.push(row);
    });
    res.status(201).json({
      id: row.id,
      userId: row.user_id,
      blockId: row.block_id,
      notificationTime: row.notification_time,
      label: row.label,
    });
  }
);

app.delete('/api/reminders/:id', requireAuth, (req, res) => {
  let found = false;
  mutate((d) => {
    const rem = d.reminders.find((r) => r.id === req.params.id);
    if (!rem || rem.user_id !== req.authUserId) return;
    const n = d.reminders.filter((r) => r.id !== req.params.id);
    if (n.length !== d.reminders.length) found = true;
    d.reminders = n;
  });
  if (!found) return res.status(404).json({ error: 'Not found' });
  res.json({ ok: true });
});

app.get(
  '/api/users/:userId/sleep',
  requireAuth,
  requireUserParam('userId'),
  (req, res) => {
    const d = readStore();
    const rows = d.sleep_data
      .filter((r) => r.user_id === req.params.userId)
      .sort((a, b) => (b.date || '').localeCompare(a.date || ''))
      .slice(0, 60);
    res.json(
      rows.map((r) => ({
        id: r.id,
        userId: r.user_id,
        date: r.date,
        sleepTime: r.sleep_time,
        wakeTime: r.wake_time,
        sleepScore: r.sleep_score,
      }))
    );
  }
);

function assistantContextForUser(userId) {
  const d = readStore();
  const u = d.users[userId];
  if (!u) return null;
  const blocks = d.schedule_blocks
    .filter((b) => b.user_id === userId)
    .map((b) => ({
      id: b.id,
      day: b.day,
      start_minutes: b.start_minutes,
      end_minutes: b.end_minutes,
      type: b.type,
      title: b.title || '',
    }));
  const sleepRows = d.sleep_data
    .filter((r) => r.user_id === userId)
    .sort((a, b) => (b.date || '').localeCompare(a.date || ''))
    .map((r) => ({
      date: r.date,
      sleep_score: r.sleep_score,
      sleep_time: r.sleep_time,
      wake_time: r.wake_time,
    }));
  const activityLog = d.block_activity_log || [];
  return {
    user: rowUser(u),
    blocks,
    sleepRows,
    activityLog,
  };
}

app.get(
  '/api/users/:userId/assistant/insights',
  requireAuth,
  requireUserParam('userId'),
  (req, res) => {
    const ctx = assistantContextForUser(req.params.userId);
    if (!ctx) return res.status(404).json({ error: 'User not found' });
    res.json(buildAssistantInsights(ctx));
  }
);

app.post(
  '/api/users/:userId/assistant/chat',
  requireAuth,
  requireUserParam('userId'),
  (req, res) => {
    const ctx = assistantContextForUser(req.params.userId);
    if (!ctx) return res.status(404).json({ error: 'User not found' });
    const { message } = req.body || {};
    const { reply, usedInsight } = replyCoachChat(message, ctx);
    res.json({ reply, usedInsight });
  }
);

app.post(
  '/api/users/:userId/sleep',
  requireAuth,
  requireUserParam('userId'),
  (req, res) => {
    const id = nanoid();
    const { date, sleepTime, wakeTime, sleepScore } = req.body;
    const row = {
      id,
      user_id: req.params.userId,
      date,
      sleep_time: sleepTime || null,
      wake_time: wakeTime || null,
      sleep_score: sleepScore ?? null,
    };
    mutate((d) => {
      d.sleep_data.push(row);
    });
    res.status(201).json({
      id: row.id,
      userId: row.user_id,
      date: row.date,
      sleepTime: row.sleep_time,
      wakeTime: row.wake_time,
      sleepScore: row.sleep_score,
    });
  }
);

app.listen(PORT, () => console.log(`FlexFlow API http://localhost:${PORT}`));
