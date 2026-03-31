const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const multer = require('multer');
const { randomUUID } = require('crypto');

const app = express();
const PORT = process.env.PORT || 3000;
const JWT_SECRET = process.env.JWT_SECRET || 'NepalDigitalEducationSecret2026!';
const DB_PATH = path.join(__dirname, 'data', 'db.json');
const VIDEOS_DIR = path.join(__dirname, 'videos');
const ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'admin@ndeducation.com';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'Admin@123';

function safeJson(value) {
  return JSON.parse(JSON.stringify(value));
}

async function ensureStorage() {
  await fs.promises.mkdir(path.join(__dirname, 'data'), { recursive: true });
  await fs.promises.mkdir(VIDEOS_DIR, { recursive: true });
  if (!fs.existsSync(DB_PATH)) {
    await fs.promises.writeFile(DB_PATH, JSON.stringify({ users: [], videos: [] }, null, 2), 'utf8');
  }
}

async function readDb() {
  await ensureStorage();
  const file = await fs.promises.readFile(DB_PATH, 'utf8');
  return JSON.parse(file || '{"users":[],"videos":[]}');
}

async function writeDb(data) {
  await fs.promises.writeFile(DB_PATH, JSON.stringify(data, null, 2), 'utf8');
}

async function createDefaultAdmin() {
  const db = await readDb();
  if (!Array.isArray(db.users)) db.users = [];
  if (!Array.isArray(db.videos)) db.videos = [];
  const adminExists = db.users.some((user) => user.role === 'admin' && user.email === ADMIN_EMAIL);
  if (!adminExists) {
    const hashed = await bcrypt.hash(ADMIN_PASSWORD, 10);
    db.users.push({
      id: `admin-${randomUUID()}`,
      name: 'Admin',
      email: ADMIN_EMAIL,
      password: hashed,
      role: 'admin'
    });
    await writeDb(db);
    console.log('Created default admin account:', ADMIN_EMAIL);
  }
}

function generateToken(user) {
  return jwt.sign({ sub: user.id, role: user.role, name: user.name, email: user.email }, JWT_SECRET, {
    expiresIn: '8h'
  });
}

function authMiddleware(req, res, next) {
  const authHeader = req.headers.authorization || '';
  const token = authHeader.startsWith('Bearer ') ? authHeader.split(' ')[1] : null;
  if (!token) return res.status(401).json({ message: 'Authorization token required.' });
  try {
    const payload = jwt.verify(token, JWT_SECRET);
    req.user = payload;
    next();
  } catch (error) {
    return res.status(401).json({ message: 'Invalid or expired token.' });
  }
}

function adminOnly(req, res, next) {
  if (!req.user || req.user.role !== 'admin') {
    return res.status(403).json({ message: 'Admin access required.' });
  }
  next();
}

const storage = multer.diskStorage({
  destination(req, file, cb) {
    cb(null, VIDEOS_DIR);
  },
  filename(req, file, cb) {
    const safeName = `${Date.now()}-${file.originalname.replace(/\s+/g, '_')}`;
    cb(null, safeName);
  }
});
const upload = multer({ storage, limits: { fileSize: 300 * 1024 * 1024 } });

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname)));

app.get('/api/ping', (req, res) => {
  res.json({ status: 'ok', time: new Date().toISOString() });
});

app.post('/api/auth/login', async (req, res) => {
  const { email, password } = req.body || {};
  if (!email || !password) {
    return res.status(400).json({ message: 'Email and password are required.' });
  }
  const db = await readDb();
  const user = (db.users || []).find((item) => item.email.toLowerCase() === email.toLowerCase());
  if (!user) return res.status(401).json({ message: 'Invalid login credentials.' });
  const passwordMatches = await bcrypt.compare(password, user.password);
  if (!passwordMatches) return res.status(401).json({ message: 'Invalid login credentials.' });
  const token = generateToken(user);
  res.json({ token, role: user.role, name: user.name, email: user.email });
});

app.post('/api/auth/register', async (req, res) => {
  const { name, email, password } = req.body || {};
  if (!name || !email || !password) {
    return res.status(400).json({ message: 'Name, email, and password are required.' });
  }
  const db = await readDb();
  const users = db.users || [];
  const existing = users.find((item) => item.email.toLowerCase() === email.toLowerCase());
  if (existing) return res.status(409).json({ message: 'A user with this email already exists.' });
  const hashed = await bcrypt.hash(password, 10);
  const newUser = {
    id: `user-${randomUUID()}`,
    name: name.trim(),
    email: email.toLowerCase().trim(),
    password: hashed,
    role: 'student'
  };
  users.push(newUser);
  await writeDb({ ...db, users });
  res.json({ message: 'Student account created successfully. Please sign in to continue.' });
});

app.get('/api/me', authMiddleware, async (req, res) => {
  const db = await readDb();
  const user = (db.users || []).find((item) => item.id === req.user.sub);
  if (!user) return res.status(404).json({ message: 'User not found.' });
  res.json({ id: user.id, name: user.name, email: user.email, role: user.role });
});

app.get('/api/videos', authMiddleware, async (req, res) => {
  const db = await readDb();
  const videos = (db.videos || []).map((video) => safeJson(video));
  res.json(videos);
});

app.post('/api/admin/upload-video', authMiddleware, adminOnly, upload.single('video'), async (req, res) => {
  if (!req.file) return res.status(400).json({ message: 'Video file is required.' });
  const { title, description } = req.body || {};
  if (!title || !description) {
    return res.status(400).json({ message: 'Title and description are required.' });
  }
  const db = await readDb();
  const videoRecord = {
    id: `video-${randomUUID()}`,
    title: title.trim(),
    description: description.trim(),
    filename: req.file.filename,
    uploadedAt: new Date().toISOString()
  };
  db.videos = db.videos || [];
  db.videos.unshift(videoRecord);
  await writeDb(db);
  res.json({ message: 'Video uploaded successfully.', video: videoRecord });
});

app.post('/api/admin/create-student', authMiddleware, adminOnly, async (req, res) => {
  const { name, email, password } = req.body || {};
  if (!name || !email || !password) {
    return res.status(400).json({ message: 'Name, email, and password are required.' });
  }
  const db = await readDb();
  const existing = (db.users || []).find((item) => item.email.toLowerCase() === email.toLowerCase());
  if (existing) return res.status(409).json({ message: 'A user with this email already exists.' });
  const hashed = await bcrypt.hash(password, 10);
  const newUser = {
    id: `user-${randomUUID()}`,
    name: name.trim(),
    email: email.toLowerCase().trim(),
    password: hashed,
    role: 'student'
  };
  db.users.push(newUser);
  await writeDb(db);
  res.json({ message: 'Student account created successfully.', user: { id: newUser.id, name: newUser.name, email: newUser.email } });
});

app.use('/videos', express.static(VIDEOS_DIR));

app.use((req, res, next) => {
  if (req.path.startsWith('/api/')) return res.status(404).json({ message: 'API route not found.' });
  next();
});

(async function start() {
  try {
    await ensureStorage();
    await createDefaultAdmin();
    app.listen(PORT, () => {
      console.log(`Server is running at http://localhost:${PORT}`);
      console.log(`Admin login: ${ADMIN_EMAIL} / ${ADMIN_PASSWORD}`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
})();
