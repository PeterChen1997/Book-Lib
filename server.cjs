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
    author TEXT,
    coverUrl TEXT,
    readingYear TEXT,
    status TEXT,
    rating INTEGER,
    summary TEXT,
    review TEXT,
    quotes TEXT, -- JSON string
    fileUrl TEXT
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
  const books = db.prepare('SELECT * FROM books ORDER BY id DESC').all();
  // 解析 JSON 字符串
  const parsedBooks = books.map(b => ({
    ...b,
    quotes: JSON.parse(b.quotes || '[]')
  }));
  res.json(parsedBooks);
});

// 添加书籍
app.post('/api/books', upload.single('cover'), (req, res) => {
  const { title, author, readingYear, status, rating, summary, review, quotes, fileUrl } = req.body;
  const coverUrl = req.file ? `/uploads/${req.file.filename}` : req.body.coverUrl;
  
  const info = db.prepare(`
    INSERT INTO books (title, author, coverUrl, readingYear, status, rating, summary, review, quotes, fileUrl)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(title, author, coverUrl, readingYear, status, rating, summary, review, quotes || '[]', fileUrl);
  
  res.json({ id: info.lastInsertRowid, success: true });
});

// 更新书籍
app.put('/api/books/:id', upload.single('cover'), (req, res) => {
  const { id } = req.params;
  const { title, author, readingYear, status, rating, summary, review, quotes, fileUrl } = req.body;
  let query = `
    UPDATE books 
    SET title = ?, author = ?, readingYear = ?, status = ?, rating = ?, summary = ?, review = ?, quotes = ?, fileUrl = ?
  `;
  const params = [title, author, readingYear, status, rating, summary, review, quotes || '[]', fileUrl];
  
  if (req.file) {
    query += `, coverUrl = ?`;
    params.push(`/uploads/${req.file.filename}`);
  }
  
  query += ` WHERE id = ?`;
  params.push(id);
  
  db.prepare(query).run(...params);
  res.json({ success: true });
});

// 删除书籍
app.delete('/api/books/:id', (req, res) => {
  db.prepare('DELETE FROM books WHERE id = ?').run(req.params.id);
  res.json({ success: true });
});

// 初始化 Mock 数据
const initMock = () => {
  const count = db.prepare('SELECT count(*) as count FROM books').get();
  if (count.count === 0) {
    const mocks = [
      {
        title: '红楼梦', author: '曹雪芹', readingYear: '2025', status: '已读', rating: 5,
        summary: '中国封建社会的百科全书。', review: '字字看来皆是血，十年辛苦不寻常。',
        quotes: JSON.stringify([{content: '满纸荒唐言，一把辛酸泪。'}]), coverUrl: 'https://img3.doubanio.com/view/subject/l/public/s1070959.jpg'
      },
      {
        title: '万历十五年', author: '黄仁宇', readingYear: '2024', status: '已读', rating: 4,
        summary: '大历史观下的明代中晚期。', review: '从看似无事的年份看透制度的僵化。',
        quotes: JSON.stringify([{content: '大凡高度的组织，其重心必在下层。'}]), coverUrl: 'https://img1.doubanio.com/view/subject/l/public/s1014757.jpg'
      },
      {
         title: '我的经验与教训', author: '苏世民', readingYear: '2025', status: '想读', rating: 5,
         summary: '黑石集团创始人的投资与人生哲学。', review: '追求卓越，不走捷径。',
         quotes: JSON.stringify([{content: '做大事和做小事的难易程度是一样的。'}]), coverUrl: 'https://img2.doubanio.com/view/subject/l/public/s33580526.jpg'
      }
    ];
    const insert = db.prepare(`
      INSERT INTO books (title, author, coverUrl, readingYear, status, rating, summary, review, quotes)
      VALUES (@title, @author, @coverUrl, @readingYear, @status, @rating, @summary, @review, @quotes)
    `);
    const insertMany = db.transaction((data) => {
      for (const b of data) insert.run(b);
    });
    insertMany(mocks);
  }
};

initMock();

app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});
