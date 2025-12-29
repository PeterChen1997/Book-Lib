const express = require('express');
const Database = require('better-sqlite3');
const multer = require('multer');
const path = require('path');
const cors = require('cors');
const fs = require('fs');
const https = require('https');

const app = express();
const port = 3001;

app.use(cors());
app.use(express.json());
app.use('/uploads', express.static(path.join(__dirname, 'server/uploads')));

// 静态文件服务（生产环境 - 服务 dist 目录）
app.use(express.static(path.join(__dirname, 'dist')));

// --- 数据库初始化 ---
const db = new Database('data/library.db');
db.exec(`
  CREATE TABLE IF NOT EXISTS books (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    author TEXT NOT NULL,
    readingDate TEXT,
    status TEXT DEFAULT '已读',
    rating INTEGER DEFAULT 5,
    summary TEXT,
    review TEXT,
    quotes TEXT,
    coverUrl TEXT,
    readingProgress INTEGER DEFAULT 0,
    totalPages INTEGER DEFAULT 0,
    fileUrl TEXT,
    userRating REAL,
    recommendation TEXT,
    isbn TEXT,
    doubanId TEXT
  )
`);

// --- 数据库迁移系统 ---
db.exec(`
  CREATE TABLE IF NOT EXISTS migrations (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL UNIQUE,
    applied_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  )
`);

// Migration 2: Add userRating and recommendation if they don't exist
const tableInfo = db.prepare("PRAGMA table_info(books)").all();
if (!tableInfo.find(c => c.name === 'userRating')) {
  db.exec("ALTER TABLE books ADD COLUMN userRating REAL");
}
if (!tableInfo.find(c => c.name === 'recommendation')) {
  db.exec("ALTER TABLE books ADD COLUMN recommendation TEXT");
}
if (!tableInfo.find(c => c.name === 'isbn')) {
  db.exec("ALTER TABLE books ADD COLUMN isbn TEXT");
}
if (!tableInfo.find(c => c.name === 'doubanId')) {
  db.exec("ALTER TABLE books ADD COLUMN doubanId TEXT");
}

const runMigration = (name, sql) => {
  const migration = db.prepare('SELECT * FROM migrations WHERE name = ?').get(name);
  if (!migration) {
    console.log(`Running migration: ${name}`);
    db.exec(sql);
    db.prepare('INSERT INTO migrations (name) VALUES (?)').run(name);
  }
};

// Migration 001: 将所有“想读”状态变更为“已读”
runMigration('001_remove_want_to_read', `
  UPDATE books SET status = '已读' WHERE status = '想读';
`);

// Migration 002: 创建 isbn 和 doubanId 唯一索引
runMigration('002_add_unique_indexes', `
  CREATE UNIQUE INDEX IF NOT EXISTS idx_books_isbn ON books(isbn) WHERE isbn IS NOT NULL;
  CREATE UNIQUE INDEX IF NOT EXISTS idx_books_doubanId ON books(doubanId) WHERE doubanId IS NOT NULL;
`);

db.exec(`
  CREATE TABLE IF NOT EXISTS notes (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    book_id INTEGER NOT NULL,
    content TEXT NOT NULL,
    page_number INTEGER,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (book_id) REFERENCES books (id) ON DELETE CASCADE
  )
`);

// --- 文件上传配置 ---
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const dir = 'server/uploads';
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    cb(null, dir);
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + path.extname(file.originalname));
  }
});
const upload = multer({ storage });

// --- 图片本地化工具 ---
const downloadImage = (url, dest) => {
  return new Promise((resolve, reject) => {
    const file = fs.createWriteStream(dest);
    const options = {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
        'Referer': 'https://book.douban.com/'
      }
    };
    https.get(url, options, (response) => {
      if (response.statusCode !== 200) {
        reject(new Error(`Failed to download: ${response.statusCode}`));
        return;
      }
      response.pipe(file);
      file.on('finish', () => {
        file.close(resolve);
      });
    }).on('error', (err) => {
      reject(err);
    });
  });
};

const ensureLocalCover = async (coverUrl) => {
  if (coverUrl && coverUrl.startsWith('http')) {
    const filename = `douban_${Date.now()}_${path.basename(coverUrl)}`;
    const localPath = path.join(__dirname, 'server/uploads', filename);
    const dir = path.dirname(localPath);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    
    try {
      await downloadImage(coverUrl, localPath);
      return `/uploads/${filename}`;
    } catch (err) {
      console.error('Cover download failed:', err);
      return coverUrl; // Fallback to original
    }
  }
  return coverUrl;
};

// --- 接口实现 ---

// 获取所有书籍
app.get('/api/books', (req, res) => {
  let query = 'SELECT * FROM books';
  const params = [];
  
  const { search, sort } = req.query;
  
  if (search) {
    query += ' WHERE title LIKE ? OR author LIKE ?';
    params.push(`%${search}%`, `%${search}%`);
  }
  
  if (sort === 'rating') query += ' ORDER BY rating DESC';
  else if (sort === 'date') query += ' ORDER BY readingDate DESC';
  else query += ' ORDER BY id DESC';

  const books = db.prepare(query).all(...params);
  
  // 解析 JSON 字符串
  const parsedBooks = books.map(b => ({
    ...b,
    quotes: JSON.parse(b.quotes || '[]')
  }));
  res.json(parsedBooks);
});

// 添加书籍
app.post('/api/books', upload.single('cover'), async (req, res) => {
  const { title, author, readingDate, status, rating, summary, review, quotes, readingProgress, totalPages, fileUrl, userRating, recommendation, isbn, doubanId } = req.body;
  
  // 去重检查：先检查 ISBN，再检查豆瓣ID
  if (isbn) {
    const existingByIsbn = db.prepare('SELECT id, title FROM books WHERE isbn = ?').get(isbn);
    if (existingByIsbn) {
      return res.status(409).json({ success: false, message: `书籍已存在（ISBN: ${isbn}）`, existingBook: existingByIsbn });
    }
  }
  if (doubanId) {
    const existingByDoubanId = db.prepare('SELECT id, title FROM books WHERE doubanId = ?').get(doubanId);
    if (existingByDoubanId) {
      return res.status(409).json({ success: false, message: `书籍已存在（豆瓣ID: ${doubanId}）`, existingBook: existingByDoubanId });
    }
  }

  let coverUrl = req.file ? `/uploads/${req.file.filename}` : (req.body.coverUrl || null);
  
  if (coverUrl && coverUrl.startsWith('http')) {
    coverUrl = await ensureLocalCover(coverUrl);
  }

  const stmt = db.prepare(`
    INSERT INTO books (title, author, readingDate, status, rating, summary, review, quotes, coverUrl, readingProgress, totalPages, fileUrl, userRating, recommendation, isbn, doubanId)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);
  
  const quotesStr = typeof quotes === 'string' ? quotes : JSON.stringify(quotes || []);
  const info = stmt.run(
    title, author, readingDate, status, rating || 5, summary, review, quotesStr, coverUrl,
    readingProgress || 0, totalPages || 0, fileUrl,
    userRating ? parseFloat(userRating) : null,
    recommendation || null,
    isbn || null,
    doubanId || null
  );
  
  res.json({ id: info.lastInsertRowid, success: true });
});

// 更新书籍
app.put('/api/books/:id', upload.single('cover'), async (req, res) => {
  const { id } = req.params;
  const updateFields = ['title', 'author', 'readingDate', 'status', 'rating', 'summary', 'review', 'quotes', 'readingProgress', 'totalPages', 'fileUrl', 'userRating', 'recommendation', 'isbn', 'doubanId'];
  const params = [];
  let setClauses = [];

  updateFields.forEach(key => {
    if (req.body[key] !== undefined) {
      setClauses.push(`${key} = ?`);
      // Handle quotes specifically if it's an array, stringify it
      if (key === 'quotes' && Array.isArray(req.body[key])) {
        params.push(JSON.stringify(req.body[key]));
      } else if (key === 'userRating') {
        params.push(req.body[key] ? parseFloat(req.body[key]) : null);
      }
      else {
        params.push(req.body[key]);
      }
    }
  });
  
  if (req.file) {
    setClauses.push(`coverUrl = ?`);
    params.push(`/uploads/${req.file.filename}`);
  } else if (req.body.coverUrl !== undefined) {
    let coverUrl = req.body.coverUrl;
    if (coverUrl && coverUrl.startsWith('http')) {
      coverUrl = await ensureLocalCover(coverUrl);
    }
    setClauses.push(`coverUrl = ?`);
    params.push(coverUrl);
  }

  if (setClauses.length === 0) {
    return res.status(400).json({ success: false, message: 'No fields to update' });
  }

  let query = `UPDATE books SET ${setClauses.join(', ')} WHERE id = ?`;
  params.push(id);
  
  db.prepare(query).run(...params);
  res.json({ success: true });
});

// 删除书籍
app.delete('/api/books/:id', (req, res) => {
  db.prepare('DELETE FROM books WHERE id = ?').run(req.params.id);
  res.json({ success: true });
});

// 批量保存书籍 (用于管理员导入)
app.post('/api/admin/batch-save', async (req, res) => {
  const { books } = req.body;
  
  if (!books || !Array.isArray(books)) {
    return res.status(400).json({ success: false, message: 'Invalid books data' });
  }

  const stmt = db.prepare(`
    INSERT INTO books (title, author, readingDate, status, rating, summary, review, quotes, coverUrl, readingProgress, totalPages, userRating, recommendation, isbn, doubanId)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  try {
    const results = [];
    const skipped = [];
    
    for (const book of books) {
      // 去重检查
      if (book.isbn) {
        const existingByIsbn = db.prepare('SELECT id, title FROM books WHERE isbn = ?').get(book.isbn);
        if (existingByIsbn) {
          skipped.push({ title: book.title, reason: `ISBN已存在: ${book.isbn}` });
          continue;
        }
      }
      if (book.doubanId) {
        const existingByDoubanId = db.prepare('SELECT id, title FROM books WHERE doubanId = ?').get(book.doubanId);
        if (existingByDoubanId) {
          skipped.push({ title: book.title, reason: `豆瓣ID已存在: ${book.doubanId}` });
          continue;
        }
      }

      let coverUrl = book.coverUrl;
      if (coverUrl && coverUrl.startsWith('http')) {
        coverUrl = await ensureLocalCover(coverUrl);
      }

      const info = stmt.run(
        book.title,
        book.author,
        book.readingDate || new Date().toISOString().split('T')[0],
        '已读',
        parseFloat(book.rating) || 5.0,
        book.summary || '',
        book.review || '',
        JSON.stringify(book.quotes || []),
        coverUrl || null,
        100, // 批量导入默认为已读
        parseInt(book.totalPages) || 0,
        book.userRating ? parseFloat(book.userRating) : null,
        book.recommendation || null,
        book.isbn || null,
        book.doubanId || null
      );
      results.push({ id: info.lastInsertRowid, title: book.title });
    }
    res.json({ success: true, imported: results.length, skipped: skipped.length, skippedBooks: skipped });
  } catch (err) {
    console.error('Batch save failed:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// --- 笔记相关接口 ---

// 获取书籍的所有笔记
app.get('/api/books/:id/notes', (req, res) => {
  const { id } = req.params;
  const notes = db.prepare('SELECT * FROM notes WHERE book_id = ? ORDER BY created_at DESC').all(id);
  res.json(notes);
});

// 批量导入笔记
app.post('/api/books/:id/notes/import', (req, res) => {
  const { id } = req.params;
  const { content } = req.body; // 预想是长文本或数组
  
  if (!content) return res.status(400).json({ success: false, message: 'Content is required' });

  let notesToInsert = [];
  if (Array.isArray(content)) {
    notesToInsert = content;
  } else {
    // 简单的按行拆分逻辑，后续可优化
    notesToInsert = content.split('\n').filter(line => line.trim() !== '');
  }

  const insert = db.prepare('INSERT INTO notes (book_id, content) VALUES (?, ?)');
  const transaction = db.transaction((notes) => {
    for (const note of notes) {
      insert.run(id, typeof note === 'string' ? note : note.content);
    }
  });

  transaction(notesToInsert);
  res.json({ success: true, count: notesToInsert.length });
});

// 更新笔记
app.put('/api/notes/:id', (req, res) => {
  const { id } = req.params;
  const { content } = req.body;
  db.prepare('UPDATE notes SET content = ? WHERE id = ?').run(content, id);
  res.json({ success: true });
});

// 删除笔记
app.delete('/api/notes/:id', (req, res) => {
  const { id } = req.params;
  db.prepare('DELETE FROM notes WHERE id = ?').run(id);
  res.json({ success: true });
});

// --- 年度书单相关接口 ---

// 加载年度书单数据
const loadAnnualBookList = () => {
  const dataPath = path.join(__dirname, 'data/annual-book-list.json');
  try {
    if (fs.existsSync(dataPath)) {
      const data = fs.readFileSync(dataPath, 'utf8');
      return JSON.parse(data);
    }
  } catch (err) {
    console.error('Failed to load annual book list:', err);
  }
  return {};
};

// 获取所有年份的年度书单列表
app.get('/api/annual-lists', (req, res) => {
  const data = loadAnnualBookList();
  const years = Object.keys(data).map(year => ({
    year,
    title: data[year].title,
    description: data[year].description,
    count: data[year].items?.length || 0
  }));
  res.json(years);
});

// 获取指定年份的年度书单详情
app.get('/api/annual-lists/:year', (req, res) => {
  const { year } = req.params;
  const data = loadAnnualBookList();
  
  if (data[year]) {
    res.json(data[year]);
  } else {
    res.status(404).json({ success: false, message: `No annual list found for year ${year}` });
  }
});

// 初始化 Mock 数据
const initMock = () => {
  const count = db.prepare('SELECT count(*) as count FROM books').get();
  if (count.count === 0) {
    // 默认不添加 mock，让用户自己导入
    console.log('No books found, keeping database empty.');
  }
};

initMock();

// SPA Fallback - 所有非 API 请求返回 index.html
// 使用 fs.readFile 避免 Express 5 sendFile 的问题
const indexHtmlPath = path.resolve(__dirname, 'dist', 'index.html');
let indexHtmlCache = null;

app.use((req, res, next) => {
  // 只处理 GET 请求
  if (req.method !== 'GET') {
    return next();
  }
  // 跳过 API 路径和静态资源
  if (req.path.startsWith('/api/') || req.path.startsWith('/uploads/') || req.path.includes('.')) {
    return next();
  }
  
  // 使用缓存的 index.html（生产环境）
  if (indexHtmlCache) {
    res.type('html').send(indexHtmlCache);
    return;
  }
  
  fs.readFile(indexHtmlPath, 'utf8', (err, data) => {
    if (err) {
      console.error('Failed to read index.html:', indexHtmlPath, err);
      return next(err);
    }
    indexHtmlCache = data;
    res.type('html').send(data);
  });
});

app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});
