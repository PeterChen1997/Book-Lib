/**
 * 2025年度书单批量导入脚本
 * 
 * 功能：
 * 1. 从豆瓣下载书籍封面图片到本地
 * 2. 将书籍信息批量导入到数据库
 * 
 * 使用方法：node scripts/import-2025-books.cjs
 */

const https = require('https');
const fs = require('fs');
const path = require('path');
const Database = require('better-sqlite3');

// 书籍数据
const books = [
  {
    title: '高效能人士的七个习惯',
    author: '[美] 史蒂芬·柯维',
    rating: 8.6,
    isbn: '9787515326399',
    publisher: '中国青年出版社',
    publishYear: '2015-2-1',
    translator: '高新勇 / 王亦兵 / 葛雪蕾',
    coverUrl: 'https://img1.doubanio.com/view/subject/s/public/s29471649.jpg',
    summary: '《高效能人士的七个习惯》是一部永恒的畅销书，里程碑式的著作。它不仅是企业、组织管理者的必读书，更是每个渴望在职场和生活中获得成功的人的行动指南。书中提出的七个习惯，从个人成功到公众成功，涵盖了从思维方式到行为习惯的全方位转变。'
  },
  {
    title: '回归职场 (上海多云,有时有雨)',
    author: '吕瞻呈',
    rating: 8.0,
    isbn: '9787559413253',
    publisher: '江苏凤凰文艺出版社',
    publishYear: '2018-2-1',
    translator: '',
    coverUrl: 'https://img1.doubanio.com/view/subject/s/public/s29676644.jpg',
    summary: '研究生毕业以后，林烟霏选择留在上海做一名离婚律师。身负家庭和自我双重使命的林烟霏，在遭遇了一连串的阴谋、坎坷和挫折之后，逐渐揭开了命运的底牌，慢慢找到并实现了自身价值。'
  },
  {
    title: '被讨厌的勇气',
    author: '[日] 岸见一郎 / 古贺史健',
    rating: 8.6,
    isbn: '9787111495482',
    publisher: '机械工业出版社',
    publishYear: '2015-4',
    translator: '渠海霞',
    coverUrl: 'https://img3.doubanio.com/view/subject/s/public/s33828853.jpg',
    summary: '本书采用青年与哲人对话的形式，深入浅出地介绍了阿德勒心理学的核心思想。它告诉我们，决定我们身份的不是过去的经历，而是我们赋予经历的意义。拥有"被讨厌的勇气"，才能获得真正的自由和幸福。'
  },
  {
    title: '仿生人会梦见电子羊吗？',
    author: '[美] 菲利普·迪克',
    rating: 8.8,
    isbn: '9787544738767',
    publisher: '译林出版社',
    publishYear: '2013-9',
    translator: '许东华',
    coverUrl: 'https://img9.doubanio.com/view/subject/s/public/s26858994.jpg',
    summary: '核战后，地球已不再适合人类居住。仿生人不满足于被人类奴役的现状，想方设法逃回地球。主人公里克·德卡德是一名专门追捕逃亡仿生人的赏赏金猎人。在追捕过程中，他开始反思人类与仿生人的界限。'
  },
  {
    title: '变形记',
    author: '[奥] 弗兰茨·卡夫卡',
    rating: 8.5,
    isbn: '9787533917067',
    publisher: '浙江文艺出版社',
    publishYear: '2003-4',
    translator: '佟明',
    coverUrl: 'https://img9.doubanio.com/view/subject/s/public/s26042134.jpg',
    summary: '推销员格里高尔某天早上醒来后变成了甲虫，这一变故对其本人和家庭产生了巨大影响。格里高尔在亲情冷漠的情况下饥寒交迫，最终在孤独中死去。作品深刻揭示了现代社会中人的异化和人际关系的冷漠。'
  },
  {
    title: '列奥纳多·达·芬奇传',
    author: '[美] 沃尔特·艾萨克森',
    rating: 8.9,
    isbn: '9787508690322',
    publisher: '中信出版社',
    publishYear: '2018-8',
    translator: '汪冰',
    coverUrl: 'https://img9.doubanio.com/view/subject/s/public/s29822180.jpg',
    summary: '达·芬奇能将艺术、科学、技术和想象力融为一体。带着顽皮而执着的热情，达·芬奇孜孜不倦地投入对众多领域的创新与探索，包括解剖学、化石、鸟类、飞行器、光学、植物学、地质学、水流，以及军事装置。'
  },
  {
    title: '习惯逃避',
    author: '李国翠',
    rating: 7.2,
    isbn: '9787545558418',
    publisher: '天地出版社',
    publishYear: '2020-9-1',
    translator: '',
    coverUrl: 'https://img9.doubanio.com/view/subject/s/public/s33722510.jpg',
    summary: '本书从"逃避心理"的角度入手，找出我们在生活中习惯逃避的原因，让受困于逃避心理的人们，重拾自信，找到直面人生的勇气。麻烦不会因为你暂时逃避而凭空消失，只有学会勇敢面对，你才能走向明亮的人生。'
  },
  {
    title: '低欲望社会',
    author: '[日] 大前研一',
    rating: 6.3,
    isbn: '9787532779529',
    publisher: '上海译文出版社',
    publishYear: '2018-10',
    translator: '姜建强',
    coverUrl: 'https://img2.doubanio.com/view/subject/s/public/s29881434.jpg',
    summary: '书中针对日本当下的社会经济现状和特点，将其他发展成熟的国家尚未遇到的社会问题，概要性地归结为一个词，"低欲望社会"。反映了在经济长期低迷背景下，年轻人丧失奋斗动力、消费意愿低下的社会现象。'
  },
  {
    title: '佐贺的超级阿嬷',
    author: '岛田洋七',
    rating: 8.8,
    isbn: '9787544245920',
    publisher: '南海出版公司',
    publishYear: '2010-1',
    translator: '陈宝莲',
    coverUrl: 'https://img1.doubanio.com/view/subject/s/public/s4124354.jpg',
    summary: '在极端艰苦的日子里，乐观的外婆却总有神奇法子，让生活充满温暖、力量和希望，让家里永远充满笑声。这本书传递了积极向上的生活态度和深厚的祖孙情谊。'
  },
  {
    title: '如何对付蠢人',
    author: '[法]马克西姆·罗维尔',
    rating: 7.1,
    isbn: '9787511749161',
    publisher: '中央编译出版社',
    publishYear: '2025-7',
    translator: '蔡宏宁',
    coverUrl: 'https://img1.doubanio.com/view/subject/s/public/s34855546.jpg',
    summary: '法国哲学家马克西姆·罗维尔重新思考"蠢人"的定义，审视我们与他人、与自我的关系，检视日常生活中那些不愉快的人际互动，为各类冲突指出可行的解决办法。'
  },
  {
    title: '因为独特',
    author: '[德] 安德烈亚斯·雷克维茨',
    rating: 8.1,
    isbn: '9787521706642',
    publisher: '中信出版集团',
    publishYear: '2019-8',
    translator: '巩捷',
    coverUrl: 'https://img9.doubanio.com/view/subject/s/public/s33455146.jpg',
    summary: '本书分析了现代社会从"普遍性"向"独特性"的转变。在晚现代，人们不再追求平庸的标准化生活，而是渴望展现个性和独特性。这种转变深刻影响了消费、工作和自我认同。'
  },
  {
    title: '西尔斯过敏全书',
    author: '[美] 威廉·西尔斯 / 玛莎·西尔斯',
    rating: 8.2,
    isbn: '9787510134814',
    publisher: '中国人口出版社',
    publishYear: '2015-10',
    translator: '邵艳美',
    coverUrl: 'https://img1.doubanio.com/view/subject/s/public/s28343516.jpg',
    summary: '西尔斯博士在书中详细介绍了各种过敏症的成因、症状及防治方法。针对儿童过敏问题，提供了实用的护理建议和饮食指导，是家长应对孩子过敏问题的权威指南。'
  },
  {
    title: '蛤蟆先生去看心理医生',
    author: '[英] 罗伯特·戴博德',
    rating: 8.4,
    isbn: '9787201161693',
    publisher: '天津人民出版社',
    publishYear: '2020-8',
    translator: '陈赢',
    coverUrl: 'https://img9.doubanio.com/view/subject/s/public/s33717193.jpg',
    summary: '蛤蟆先生因为抑郁找心理医生苍鹭咨询。在十次咨询中，蛤蟆先生逐渐探索了自己的内心世界，理解了情绪的来源，并最终找回了自信和快乐。这是一本非常优秀的心理学入门读物。'
  },
  {
    title: '我看见的世界',
    author: '[美] 李飞飞',
    rating: 8.8,
    isbn: '9787521762181',
    publisher: '中信出版集团',
    publishYear: '2024-4',
    translator: '赵灿',
    coverUrl: 'https://img1.doubanio.com/view/subject/s/public/s34746654.jpg',
    summary: '《我看见的世界》既是李飞飞的个人史，也是一部波澜壮阔的人工智能发展史。李飞飞回忆了自己从底层移民成长到顶尖科学家的经历，并对未来人工智能的发展方向提出了"以人为本"的判断。'
  },
  {
    title: '小王子',
    author: '[法] 安东尼·德·圣-埃克苏佩里',
    rating: 9.1,
    isbn: '9787020042494',
    publisher: '人民文学出版社',
    publishYear: '2003-8',
    translator: '马振骋',
    coverUrl: 'https://img2.doubanio.com/view/subject/s/public/s1103152.jpg',
    summary: '小王子是一个超凡脱俗的仙童，他住在一颗只比他大一丁点儿的小行星上。在地理学家的指点下，孤单的小王子来到人类居住的地球。小狐狸把自己心中的秘密——肉眼看不见事务的本质，只有用心灵才能洞察一切——作为礼物，送给小王子。'
  },
  {
    title: '吃的营养与治疗',
    author: '阿德勒·戴维斯',
    rating: 8.4,
    isbn: '9787229002732',
    publisher: '重庆出版社',
    publishYear: '2009-1',
    translator: '',
    coverUrl: 'https://img2.doubanio.com/view/subject/s/public/s3354316.jpg',
    summary: '《吃的营养与治疗》说明了食物的医疗作用，强调了饮食保健的重要性。作者探讨了全面补充营养对于防治疾病的重要性，认为营养不足所引起的疾病，在未造成严重伤害之前，及时补充所需的营养，便可重获健康。'
  },
  {
    title: '梵高手稿',
    author: '[荷] 文森特•梵高',
    rating: 9.5,
    isbn: '9787550263802',
    publisher: '北京联合出版公司',
    publishYear: '2015-12',
    translator: '57°N艺术小组',
    coverUrl: 'https://img9.doubanio.com/view/subject/s/public/s28351611.jpg',
    summary: '梵高一生中写过很多信，大多数都是寄给弟弟提奥的。在这本梵高书信集中，精心挑选了150多封，撷取了梵高在其中描写这些作品创作、构思过程的片段，以及他对艺术、艺术家、文学、宗教、景观等众多话题的独特见解。'
  },
  {
    title: '遇见未知的自己',
    author: '张德芬',
    rating: 8.0,
    isbn: '9787508044019',
    publisher: '华夏出版社',
    publishYear: '2008-1',
    translator: '',
    coverUrl: 'https://img1.doubanio.com/view/subject/s/public/s2768378.jpg',
    summary: '故事从一个冬天的雨夜开始，若菱巧遇一名智慧老者，在与智者数度交谈的过程中，她渐渐填补不快乐、挫败的心灵缺口，寻回最真实勇敢的自我。本书是一本都市身心灵修行课，帮助读者遇见全新的自己。'
  },
  {
    title: '进化心理学',
    author: '[美] 戴维·巴斯',
    rating: 9.0,
    isbn: '9787100110532',
    publisher: '商务印书馆',
    publishYear: '2015-9',
    translator: '张勇 / 蒋柯',
    coverUrl: 'https://img1.doubanio.com/view/subject/s/public/s28283305.jpg',
    summary: '进化心理学是一门革命性的新科学，它提供了一个有趣而独特的视角来观察人类的心理和行为，是现代心理学和进化生物学在理论上的真正融合。本书对进化心理学这一日新月异的领域进行了全面而深入的回顾和展望。'
  },
  {
    title: '我的二本学生',
    author: '黄灯',
    rating: 7.5,
    isbn: '9787020161874',
    publisher: '人民文学出版社',
    publishYear: '2020-8-1',
    translator: '',
    coverUrl: 'https://img1.doubanio.com/view/subject/s/public/s33684216.jpg',
    summary: '作者黄灯在一所二本院校从教，长期的课堂教学以及课后的师生交流，使她成为这群学生成长变化的见证者。本书记录了对4500个学生的长期观察和长达10年的跟踪走访，向读者描摹一群年轻人生活剪影。'
  }
];

// 注意：八万四千问已在数据库中，跳过

// 下载图片函数
function downloadImage(url, dest) {
  return new Promise((resolve, reject) => {
    const dir = path.dirname(dest);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }

    const file = fs.createWriteStream(dest);
    const options = {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Referer': 'https://book.douban.com/',
        'Accept': 'image/webp,image/apng,image/svg+xml,image/*,*/*;q=0.8'
      }
    };

    https.get(url, options, (response) => {
      if (response.statusCode === 301 || response.statusCode === 302) {
        // 处理重定向
        downloadImage(response.headers.location, dest).then(resolve).catch(reject);
        return;
      }
      if (response.statusCode !== 200) {
        reject(new Error(`Failed to download ${url}: HTTP ${response.statusCode}`));
        return;
      }
      response.pipe(file);
      file.on('finish', () => {
        file.close();
        resolve(dest);
      });
    }).on('error', (err) => {
      fs.unlink(dest, () => {}); // 删除失败的文件
      reject(err);
    });
  });
}

// 主函数
async function main() {
  const uploadsDir = path.join(__dirname, '..', 'server', 'uploads');
  if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
  }

  const db = new Database(path.join(__dirname, '..', 'data', 'library.db'));
  
  // 检查已存在的书籍（使用 ISBN）
  const existingBooks = db.prepare('SELECT isbn, title FROM books WHERE isbn IS NOT NULL').all();
  const existingIsbns = new Set(existingBooks.map(b => b.isbn));

  console.log('=== 2025年度书单导入脚本 ===\n');
  console.log(`数据库中已有 ${existingBooks.length} 本书籍（有ISBN）`);

  const stmt = db.prepare(`
    INSERT INTO books (title, author, readingDate, status, rating, summary, review, quotes, coverUrl, totalPages, userRating, recommendation, isbn)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  let imported = 0;
  let skipped = 0;
  let failed = 0;

  for (const book of books) {
    // 使用 ISBN 去重
    if (book.isbn && existingIsbns.has(book.isbn)) {
      console.log(`⏭️  跳过（ISBN已存在）: ${book.title}`);
      skipped++;
      continue;
    }

    // 下载封面
    let localCoverUrl = null;
    if (book.coverUrl) {
      const filename = `douban_${book.isbn || Date.now()}.jpg`;
      const localPath = path.join(uploadsDir, filename);

      try {
        console.log(`📥 下载封面: ${book.title}`);
        await downloadImage(book.coverUrl, localPath);
        localCoverUrl = `/uploads/${filename}`;
        console.log(`   ✓ 保存到: ${filename}`);
      } catch (err) {
        console.error(`   ✗ 下载失败: ${err.message}`);
        localCoverUrl = book.coverUrl; // 回退到远程URL
      }
    }

    // 插入数据库
    try {
      stmt.run(
        book.title,
        book.author,
        '2025-12-27', // 阅读日期设为今天
        '已读',
        book.rating,
        book.summary,
        '', // review
        '[]', // quotes
        localCoverUrl,
        0,   // totalPages
        null, // userRating
        null, // recommendation
        book.isbn || null
      );
      console.log(`✅ 导入成功: ${book.title}`);
      imported++;
    } catch (err) {
      console.error(`❌ 导入失败: ${book.title} - ${err.message}`);
      failed++;
    }

    // 添加延迟，避免请求过快
    await new Promise(r => setTimeout(r, 500));
  }

  console.log('\n=== 导入完成 ===');
  console.log(`✅ 成功导入: ${imported} 本`);
  console.log(`⏭️  跳过: ${skipped} 本`);
  console.log(`❌ 失败: ${failed} 本`);
  console.log(`📚 当前总计: ${existingBooks.length + imported} 本`);

  db.close();
}

main().catch(console.error);
