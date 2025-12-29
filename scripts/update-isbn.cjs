/**
 * 为现有书籍补充 ISBN
 * 使用方法：node scripts/update-isbn.cjs
 */

const Database = require('better-sqlite3');
const path = require('path');

// 书籍ISBN数据（从豆瓣查询）
const bookIsbns = {
  '八万四千问': '9787807099437',
  '高效能人士的七个习惯': '9787515326399',
  '高效能人士的七个习惯 (20周年纪念版)': '9787515326399',
  '被讨厌的勇气': '9787111495482',
  '仿生人会梦见电子羊吗？': '9787544738767',
  '变形记': '9787533917067',
  '列奥纳多·达·芬奇传': '9787508690322',
  '习惯逃避': '9787545558418',
  '低欲望社会': '9787532779529',
  '佐贺的超级阿嬷': '9787544245920',
  '如何对付蠢人': '9787511749161',
  '因为独特': '9787521706642',
  '因为独特 : 泡泡玛特创始人王宁从杂货铺到IP世界的跋涉': '9787521768671',
  '西尔斯过敏全书': '9787510134814',
  '蛤蟆先生去看心理医生': '9787201161693',
  '我看见的世界': '9787521762181',
  '我看见的世界 : 李飞飞自传': '9787521762181',
  '小王子': '9787020042494',
  '吃的营养与治疗': '9787229002732',
  '梵高手稿': '9787550263802',
  '遇见未知的自己': '9787508044019',
  '进化心理学': '9787100110532',
  '进化心理学(第4版)': '9787100110532',
  '我的二本学生': '9787020161874',
  '重返大厂：创业治好了我的上班焦虑': '9787572271182',
  '重返大厂': '9787572271182'
};

async function main() {
  const db = new Database(path.join(__dirname, '..', 'data', 'library.db'));
  
  // 获取所有没有 ISBN 的书籍
  const booksWithoutIsbn = db.prepare("SELECT id, title FROM books WHERE isbn IS NULL OR isbn = ''").all();
  
  console.log('=== 补充书籍 ISBN ===\n');
  console.log(`发现 ${booksWithoutIsbn.length} 本书籍需要补充 ISBN\n`);
  
  const updateStmt = db.prepare('UPDATE books SET isbn = ? WHERE id = ?');
  
  let updated = 0;
  let notFound = 0;
  
  for (const book of booksWithoutIsbn) {
    // 尝试精确匹配
    let isbn = bookIsbns[book.title];
    
    // 如果没找到，尝试部分匹配
    if (!isbn) {
      for (const [key, value] of Object.entries(bookIsbns)) {
        if (book.title.includes(key) || key.includes(book.title)) {
          isbn = value;
          break;
        }
      }
    }
    
    if (isbn) {
      updateStmt.run(isbn, book.id);
      console.log(`✅ 更新: ${book.title} -> ${isbn}`);
      updated++;
    } else {
      console.log(`❓ 未找到: ${book.title}`);
      notFound++;
    }
  }
  
  console.log('\n=== 完成 ===');
  console.log(`✅ 已更新: ${updated} 本`);
  console.log(`❓ 未找到: ${notFound} 本`);
  
  db.close();
}

main().catch(console.error);
