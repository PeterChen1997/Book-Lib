const express = require('express');
const Database = require('better-sqlite3');
const multer = require('multer');
const path = require('path');
const cors = require('cors');
const fs = require('fs');

const app = express();
const port = 3001;

app.use(cors());
app.use(express.json());
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// --- 数据库初始化 ---
const db = new Database('data/library.db');
db.exec(`
  CREATE TABLE IF NOT EXISTS books (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    author TEXT NOT NULL,
    readingDate TEXT,
    status TEXT DEFAULT '想读',
    rating INTEGER DEFAULT 5,
    summary TEXT,
    review TEXT,
    quotes TEXT,
    coverUrl TEXT,
    readingProgress INTEGER DEFAULT 0,
    totalPages INTEGER DEFAULT 0,
    fileUrl TEXT
  )
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
app.post('/api/books', upload.single('cover'), (req, res) => {
  const { title, author, readingDate, status, rating, summary, review, quotes, readingProgress, totalPages, fileUrl } = req.body;
  const coverUrl = req.file ? `/uploads/${req.file.filename}` : (req.body.coverUrl || null);
  
  const stmt = db.prepare(`
    INSERT INTO books (title, author, readingDate, status, rating, summary, review, quotes, coverUrl, readingProgress, totalPages, fileUrl)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);
  
  const quotesStr = typeof quotes === 'string' ? quotes : JSON.stringify(quotes || []);
  const info = stmt.run(title, author, readingDate, status, rating || 5, summary, review, quotesStr, coverUrl, readingProgress || 0, totalPages || 0, fileUrl);
  
  res.json({ id: info.lastInsertRowid, success: true });
});

// 更新书籍
app.put('/api/books/:id', upload.single('cover'), (req, res) => {
  const { id } = req.params;
  const updateFields = ['title', 'author', 'readingDate', 'status', 'rating', 'summary', 'review', 'quotes', 'readingProgress', 'totalPages', 'fileUrl'];
  const params = [];
  let setClauses = [];

  updateFields.forEach(key => {
    if (req.body[key] !== undefined) {
      setClauses.push(`${key} = ?`);
      // Handle quotes specifically if it's an array, stringify it
      if (key === 'quotes' && Array.isArray(req.body[key])) {
        params.push(JSON.stringify(req.body[key]));
      } else {
        params.push(req.body[key]);
      }
    }
  });
  
  if (req.file) {
    setClauses.push(`coverUrl = ?`);
    params.push(`/uploads/${req.file.filename}`);
  } else if (req.body.coverUrl === null) { // Allow setting coverUrl to null
    setClauses.push(`coverUrl = ?`);
    params.push(null);
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

// 初始化 Mock 数据
const initMock = () => {
  const count = db.prepare('SELECT count(*) as count FROM books').get();
  if (count.count === 0) {
    const today = new Date().toISOString().split('T')[0];
    const mocks = [
      {
        title: '红楼梦', author: '曹雪芹', readingDate: '2025-01-15', status: '已读', rating: 5,
        summary: '中国封建社会的百科全书，通过贾王史薛四大家族的兴衰，展现了封建社会的百态。', review: '字字看来皆是血，十年辛苦不寻常。中国文学史上不可逾越的高山。',
        quotes: JSON.stringify([
          {content: '满纸荒唐言，一把辛酸泪。', id: 1},
          {content: '假作真时真亦假，无为有处有还无。', id: 2}
        ]), 
        coverUrl: 'https://images.unsplash.com/photo-1544947950-fa07a98d237f?auto=format&fit=crop&q=80&w=400',
        readingProgress: 100, totalPages: 500
      },
      {
        title: '万历十五年', author: '黄仁宇', readingDate: '2024-11-20', status: '已读', rating: 4,
        summary: '从看似平淡的明朝万历十五年入手，剖析中国传统社会的结构与制度。', review: '大历史观的代表作，深入浅出，令人深思。',
        quotes: JSON.stringify([{content: '大凡高度的组织，其重心必在下层。', id: 3}]), 
        coverUrl: 'https://images.unsplash.com/photo-1512820790803-714041054363?auto=format&fit=crop&q=80&w=400',
        readingProgress: 100, totalPages: 320
      },
      {
        title: '我的经验与教训', author: '苏世民', readingDate: '2025-02-10', status: '已读', rating: 5,
        summary: '黑石集团创始人苏世民的创业心路，蕴含极其深刻的商业洞察。', review: '卓越者的共同点不仅仅是努力，更是思考的维度。',
        quotes: JSON.stringify([{content: '做大事和做小事的难易程度是一样的。', id: 4}]), 
        coverUrl: 'https://images.unsplash.com/photo-1589829545856-d10d557cf95f?auto=format&fit=crop&q=80&w=400',
        readingProgress: 100, totalPages: 450
      },
      {
        title: '解忧杂货店', author: '东野圭吾', readingDate: today, status: '在读', rating: 4,
        summary: '温情治愈的悬疑小说，穿越时空的信件连接起了几个人的命运。', review: '所有的救赎，最后其实都是自救。',
        quotes: JSON.stringify([
          {content: '正因为是白纸，所以可以画任何地图。', id: 5}
        ]), 
        coverUrl: 'https://images.unsplash.com/photo-1532012197367-e338c0d96f2d?auto=format&fit=crop&q=80&w=400',
        readingProgress: 65, totalPages: 280
      }
    ];
    const insert = db.prepare(`
      INSERT INTO books (title, author, readingDate, status, rating, summary, review, quotes, coverUrl, readingProgress, totalPages)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    
    mocks.forEach(m => insert.run(m.title, m.author, m.readingDate, m.status, m.rating, m.summary, m.review, m.quotes, m.coverUrl, m.readingProgress, m.totalPages));
  }
};

initMock();

app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});
