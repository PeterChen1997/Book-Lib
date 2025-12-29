/**
 * 年度书单书籍导入脚本
 * 将从豆瓣抓取的书籍信息存入数据库，并更新年度书单的封面URL
 */

const Database = require('better-sqlite3');
const fs = require('fs');
const path = require('path');
const https = require('https');
const http = require('http');

const DB_PATH = path.join(__dirname, '../data/library.db');
const ANNUAL_LIST_PATH = path.join(__dirname, '../data/annual-book-list.json');
const COVERS_DIR = path.join(__dirname, '../public/covers');

// 确保封面目录存在
if (!fs.existsSync(COVERS_DIR)) {
  fs.mkdirSync(COVERS_DIR, { recursive: true });
}

// 从豆瓣抓取的13本书籍信息
const booksData = [
  {
    title: "夜晚的潜水艇",
    author: "陈春成",
    publisher: "上海三联书店",
    publishYear: "2020-9",
    pages: 224,
    isbn: "9787542669964",
    rating: 8.3,
    coverUrl: "https://img1.doubanio.com/view/subject/s/public/s33718940.jpg",
    summary: "《夜晚的潜水艇》是陈春成的首部小说集。九个故事，游走于旧山河与未知宇宙间，以瑰奇飘扬的想象、温厚清幽的笔法，在现实与幻境间辟开秘密的通道。",
    recommender: "Menty"
  },
  {
    title: "张忠谋自传",
    author: "张忠谋",
    publisher: "生活·读书·新知三联书店",
    publishYear: "2001-5",
    pages: 190,
    isbn: "9787108015303",
    rating: 8.8,
    coverUrl: "https://img9.doubanio.com/view/subject/s/public/s1236365.jpg",
    summary: "本书的出版，尤其难得。张先生18岁时，就从战乱中的中到达了美国哈佛大学。在以后漫长的岁月中，他一睦在英语世界中专心地读书与工作。",
    recommender: "卓扬"
  },
  {
    title: "命运",
    author: "蔡崇达",
    publisher: "浙江文艺出版社",
    publishYear: "2022-09",
    pages: null,
    isbn: "9787533969608",
    rating: 8.8,
    coverUrl: "https://img9.doubanio.com/view/subject/s/public/s34303676.jpg",
    summary: "本书是《皮囊》作者蔡崇达时隔八年回归之作，书中传达的核心信念是：只要我们一直活着，命运就永远打不败我们。",
    recommender: "航航航"
  },
  {
    title: "纳瓦尔宝典",
    author: "[美] 埃里克·乔根森",
    publisher: "中信出版社",
    publishYear: "2022-4",
    pages: null,
    isbn: "9787521741124",
    rating: 8.4,
    coverUrl: "https://img9.doubanio.com/view/subject/s/public/s34241855.jpg",
    summary: "本书收集了硅谷著名天使投资人纳瓦尔·拉维坎特的智慧，聚焦于财富积累和幸福生活的原则。强调财富和幸福都是可以学习的技能。",
    recommender: "侯占才"
  },
  {
    title: "当下的力量",
    author: "[德] 埃克哈特·托利",
    publisher: "中信出版社",
    publishYear: "2016-6",
    pages: null,
    isbn: "9787508664361",
    rating: 8.5,
    coverUrl: "https://img1.doubanio.com/view/subject/s/public/s28807248.jpg",
    summary: "《当下的力量》是身心灵大师埃克哈特·托利的经典之作，被誉为'灵性开悟的指引之书'。书中探讨了如何通过向当下的臣服来摆脱大脑思维的控制，从而获得内在的智慧与真正的喜悦。",
    recommender: "超越"
  },
  {
    title: "我人生最开始的好朋友",
    author: "蔡崇达",
    publisher: "作家出版社",
    publishYear: "2024-11",
    pages: null,
    isbn: "9787521232035",
    rating: 8.4,
    coverUrl: "https://img1.doubanio.com/view/subject/s/public/s35012729.jpg",
    summary: "童年的黑狗达，在外婆离世，最孤单的日子里，遇到了人生中最开始的好朋友。这是发生在闽南小镇上的《小王子》，人与动物互相'驯养'、互相陪伴，并在无法挽留的失去、无法叫停的变迁中共同成长。",
    recommender: "耶耶"
  },
  {
    title: "亲密关系（第6版）",
    author: "[美] 罗兰·米勒",
    publisher: "人民邮电出版社",
    publishYear: "2015-6",
    pages: null,
    isbn: "9787115390578",
    rating: 9.2,
    coverUrl: "https://img3.doubanio.com/view/subject/s/public/s34340992.jpg",
    summary: "亲密关系与泛泛之交有什么区别？大丈夫与小女子真的般配吗？吸引力的秘密是什么？男人与女人真的是不同的动物吗？米勒教授在本书中回答了这些问题，尤其澄清了通俗心理学所宣扬的经验之谈，甚至某些错误观点。",
    recommender: "oxRoot"
  },
  {
    title: "富爸爸，穷爸爸",
    author: "[美] 罗伯特·T·清崎 / 莎伦·L·莱希特",
    publisher: "世界图书出版公司",
    publishYear: "2000-09",
    pages: 205,
    isbn: "9787506246743",
    rating: 8.3,
    coverUrl: "https://img1.doubanio.com/view/subject/s/public/s11229869.jpg",
    summary: "清崎有两个爸爸：'穷爸爸'是他的亲生父亲，一个高学历的教育官员；'富爸爸'是他好朋友的父亲，一个高中没毕业却善于投资理财的企业家。清崎遵从'穷爸爸'为他设计的人生道路：上大学，服兵役，参加越战，走过了平凡的人生初期。直到1977年，清崎亲眼目睹一生辛劳的'穷爸爸'失了业，而'富爸爸'则成了夏威夷最富有的人之一。清崎毅然追寻'富爸爸'的脚步，踏入商界，从此登上了致富快车。",
    recommender: "婷薇"
  },
  {
    title: "金钱心理学",
    author: "[美] 摩根·豪泽尔",
    publisher: "民主与建设出版社",
    publishYear: "2023-6",
    pages: null,
    isbn: "9787513941242",
    rating: 8.2,
    coverUrl: "https://img9.doubanio.com/view/subject/s/public/s34540496.jpg",
    summary: "全球狂销超400万册，美国亚马逊理财类No.1，53种语言版本火爆全球！你和金钱的关系，决定了财富和你的距离！在风云变幻的投资理财领域，带你找到亘古不变的财富真相。",
    recommender: "大雨"
  },
  {
    title: "你是你吃出来的",
    author: "夏萌",
    publisher: "江西科学技术出版社",
    publishYear: "2017-9",
    pages: 278,
    isbn: "9787539060453",
    rating: 8.7,
    coverUrl: "https://img1.doubanio.com/view/subject/s/public/s29845298.jpg",
    summary: "前安贞医院营养科主任夏萌写作，总结她个人亲身经历和10万+临床案例，来说明如何通过饮食改变来帮助管理和康复高血压、糖尿病等慢性疾病。",
    recommender: "张读书"
  },
  {
    title: "愿你可以自在张扬",
    author: "刘开心",
    publisher: "北京联合出版公司",
    publishYear: "2025-1",
    pages: null,
    isbn: "9787559681683",
    rating: 8.0,
    coverUrl: "https://img3.doubanio.com/view/subject/s/public/s35056223.jpg",
    summary: "本书是刘开心的作品集，收录了她的诗歌、随笔、艺术创作。全书包括五大部分，分别以'个人介绍''童年''成长''生活''思考'为主题，汇集了她多年来的各类创作。",
    recommender: "招财欣"
  },
  {
    title: "顺道者胜",
    author: "曾仕强",
    publisher: "江苏凤凰文艺出版社",
    publishYear: "2025-6",
    pages: null,
    isbn: null,
    rating: 8.1,
    coverUrl: "https://img3.doubanio.com/view/subject/s/public/s35160303.jpg",
    summary: "本书系统阐释曾仕强教授研究《道德经》的精髓要义，围绕《道德经》的核心概念——'道'展开，通过解读'道法自然''顺道而为'等《道德经》十大经典命题，为读者梳理《道德经》的缘起、主旨和概念。",
    recommender: "晴漪"
  },
  {
    title: "从塞北到西域",
    author: "[美] 欧文·拉铁摩尔",
    publisher: "光启书局",
    publishYear: "2024-5",
    pages: null,
    isbn: "9787545219517",
    rating: 8.4,
    coverUrl: "https://img9.doubanio.com/view/subject/s/public/s34863794.jpg",
    summary: "本书是欧文·拉铁摩尔1926年从中国北方到西域的旅行游记。他与一支骆驼商队沿着沙漠古道旅行，记录了沿途的风景、旅途的危险，以及他遇到的人们的生活。",
    recommender: "Sambour"
  }
];

// 下载图片到本地
async function downloadImage(url, filename) {
  return new Promise((resolve, reject) => {
    const protocol = url.startsWith('https') ? https : http;
    const filePath = path.join(COVERS_DIR, filename);
    
    if (fs.existsSync(filePath)) {
      console.log(`  [跳过] 图片已存在: ${filename}`);
      resolve(`/public/covers/${filename}`);
      return;
    }

    const file = fs.createWriteStream(filePath);
    protocol.get(url, (response) => {
      if (response.statusCode === 302 || response.statusCode === 301) {
        // 处理重定向
        downloadImage(response.headers.location, filename).then(resolve).catch(reject);
        return;
      }
      response.pipe(file);
      file.on('finish', () => {
        file.close();
        console.log(`  [下载] ${filename}`);
        resolve(`/public/covers/${filename}`);
      });
    }).on('error', (err) => {
      fs.unlink(filePath, () => {});
      console.error(`  [错误] 下载失败: ${url}`, err.message);
      resolve(url); // 失败时返回原始URL
    });
  });
}

async function main() {
  const db = new Database(DB_PATH);
  
  console.log('=== 年度书单书籍导入 ===\n');

  // 读取年度书单
  const annualList = JSON.parse(fs.readFileSync(ANNUAL_LIST_PATH, 'utf8'));
  
  for (const book of booksData) {
    console.log(`\n处理: ${book.title} (${book.author})`);
    
    // 1. 检查数据库中是否已存在该书籍（按ISBN或书名+作者）
    let existingBook = null;
    if (book.isbn) {
      existingBook = db.prepare('SELECT * FROM books WHERE isbn = ?').get(book.isbn);
    }
    if (!existingBook) {
      existingBook = db.prepare('SELECT * FROM books WHERE title = ? AND author = ?').get(book.title, book.author);
    }
    
    // 2. 下载封面图片
    const coverFilename = `annual_${book.isbn || book.title.replace(/[^a-zA-Z0-9\u4e00-\u9fa5]/g, '_')}.jpg`;
    let localCoverPath = book.coverUrl;
    try {
      localCoverPath = await downloadImage(book.coverUrl, coverFilename);
    } catch (err) {
      console.error(`  封面下载失败: ${err.message}`);
    }
    
    // 3. 插入或更新数据库
    if (existingBook) {
      console.log(`  [更新] 书籍已存在，ID: ${existingBook.id}`);
      // 更新封面（如果之前没有）
      if (!existingBook.coverUrl || existingBook.coverUrl.includes('placeholder')) {
        db.prepare('UPDATE books SET coverUrl = ? WHERE id = ?').run(localCoverPath, existingBook.id);
        console.log(`  [更新] 封面已更新`);
      }
    } else {
      // 插入新书籍
      const result = db.prepare(`
        INSERT INTO books (title, author, isbn, rating, coverUrl, summary, status, readingDate)
        VALUES (?, ?, ?, ?, ?, ?, '已读', ?)
      `).run(
        book.title,
        book.author,
        book.isbn,
        book.rating,
        localCoverPath,
        book.summary,
        '2025-01-01'
      );
      console.log(`  [新增] 书籍已添加，ID: ${result.lastInsertRowid}`);
    }
    
    // 4. 更新年度书单中对应条目的 coverUrl
    const items = annualList['2025']?.items || [];
    const item = items.find(i => i.name === book.recommender);
    if (item) {
      item.coverUrl = localCoverPath;
      console.log(`  [更新] 年度书单封面已关联`);
    }
  }
  
  // 5. 保存更新后的年度书单
  fs.writeFileSync(ANNUAL_LIST_PATH, JSON.stringify(annualList, null, 2), 'utf8');
  console.log('\n=== 年度书单已更新 ===');
  
  db.close();
  console.log('\n完成！');
}

main().catch(console.error);
