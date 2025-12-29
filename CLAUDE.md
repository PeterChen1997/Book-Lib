# 龙场书屋 项目说明

## 项目概述
龙场书屋是一个古典中式风格的个人书籍管理应用，用于记录阅读历程和管理书籍收藏。

## 技术栈
- **前端**: React + Vite + TailwindCSS + Radix UI
- **后端**: Node.js (Express) - `server.cjs`
- **数据库**: SQLite - `data/library.db`

## 关键文件
- `src/App.jsx` - 主应用组件
- `server.cjs` - 后端 API 服务
- `data/library.db` - SQLite 数据库
- `uploads/` - 书籍封面图片

## 数据库 books 表
| 字段 | 说明 |
|------|------|
| title | 书名 |
| author | 作者 |
| doubanRating | 豆瓣评分 (1-10) |
| doubanSummary | 豆瓣简介 |
| coverUrl | 封面路径 |
| userRating | 个人评分 |

## API (仅读取)
- `GET /api/books` - 获取书籍列表
- `GET /api/books/:id` - 获取书籍详情

## 注意
- 编辑功能已禁用（SQLite 重新部署会丢失数据）
- 封面图片命名: `douban_{ISBN}.jpg`
