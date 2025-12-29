import React, { useState, useEffect } from 'react';
import { X, Book, User, Quote, Sparkles, MessageCircle, Heart, Star, ExternalLink, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { ScrollArea } from './ui/scroll-area';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from './ui/dialog';

// 每年的主题色配置
const YEAR_THEMES = {
  '2025': {
    primary: '#9d6c5a',
    gradient: 'from-[#9d6c5a]/30 via-[#b08472]/20 to-[#c4a391]/15',
    darkGradient: 'dark:from-[#9d6c5a]/40 dark:via-[#b08472]/30 dark:to-[#c4a391]/25',
    badge: 'bg-[#9d6c5a]/20 text-[#9d6c5a] dark:text-[#c4a391]',
    accent: 'text-[#9d6c5a] dark:text-[#c4a391]',
    decorCircle: 'from-[#9d6c5a]/25 to-[#b08472]/15',
  },
  'default': {
    primary: '#f59e0b',
    gradient: 'from-amber-500/20 via-orange-500/10 to-red-500/15',
    darkGradient: 'dark:from-amber-600/30 dark:via-orange-600/20 dark:to-red-600/25',
    badge: 'bg-amber-500/20 text-amber-600 dark:text-amber-400',
    accent: 'text-amber-600 dark:text-amber-400',
    decorCircle: 'from-amber-400/20 to-orange-500/10',
  }
};

/**
 * 从书名中提取纯书名（去掉书名号和作者）
 */
const extractBookTitle = (fullTitle) => {
  if (!fullTitle) return '';
  // 匹配《书名》或去掉作者部分
  const match = fullTitle.match(/《([^》]+)》/);
  if (match) return match[1];
  // 如果没有书名号，尝试按空格分割取第一部分
  return fullTitle.split(' ')[0].replace(/[《》]/g, '');
};

/**
 * 书籍详情弹窗组件 - 显示豆瓣书籍信息
 */
const BookDetailDialog = ({ book, open, onClose, theme }) => {
  const [bookInfo, setBookInfo] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (open && book) {
      fetchBookInfo();
    } else {
      setBookInfo(null);
      setError(null);
    }
  }, [open, book]);

  const fetchBookInfo = async () => {
    if (!book) return;
    
    setLoading(true);
    setError(null);
    
    try {
      // 尝试根据书名从API搜索书籍
      const bookTitle = extractBookTitle(book.bookTitle);
      const response = await fetch(`/api/books`);
      const data = await response.json();
      
      // 在数据中查找匹配的书籍
      const matchedBook = data.find(b => 
        b.title === bookTitle || 
        b.title.includes(bookTitle) ||
        bookTitle.includes(b.title)
      );
      
      if (matchedBook) {
        setBookInfo(matchedBook);
      } else {
        // 如果没找到，使用年度书单中的基本信息
        setBookInfo({
          title: bookTitle,
          author: book.bookTitle.replace(/《[^》]+》\s*/, '').trim() || '未知',
          coverUrl: book.coverUrl,
          summary: book.reason,
          rating: null
        });
      }
    } catch (err) {
      console.error('Failed to fetch book info:', err);
      setError('加载书籍信息失败');
    } finally {
      setLoading(false);
    }
  };

  if (!book) return null;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-hidden p-0">
        <ScrollArea className="max-h-[85vh]">
          <div className="p-6 md:p-8">
            {loading ? (
              <div className="flex items-center justify-center py-20">
                <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
              </div>
            ) : error ? (
              <div className="flex items-center justify-center py-20 text-muted-foreground">
                {error}
              </div>
            ) : bookInfo ? (
              <>
                {/* 头部：封面 + 基本信息 */}
                <div className="flex gap-6 mb-6">
                  {/* 封面 */}
                  <div className="w-32 md:w-40 flex-shrink-0">
                    <div className="aspect-[3/4] rounded-xl overflow-hidden shadow-xl">
                      {bookInfo.coverUrl || book.coverUrl ? (
                        <img
                          src={bookInfo.coverUrl || book.coverUrl}
                          alt={bookInfo.title}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div
                          className="w-full h-full flex items-center justify-center"
                          style={{ background: `linear-gradient(135deg, ${theme.primary}30, ${theme.primary}10)` }}
                        >
                          <Book className="w-12 h-12" style={{ color: theme.primary, opacity: 0.5 }} />
                        </div>
                      )}
                    </div>
                  </div>

                  {/* 信息 */}
                  <div className="flex-1 min-w-0">
                    <DialogHeader className="text-left p-0 space-y-2">
                      <DialogTitle className="text-2xl md:text-3xl font-black font-serif leading-tight">
                        {bookInfo.title}
                      </DialogTitle>
                    </DialogHeader>

                    {/* 作者 */}
                    <p className="text-muted-foreground mt-2">{bookInfo.author}</p>

                    {/* 豆瓣评分 */}
                    {bookInfo.rating && (
                      <div className="flex items-center gap-2 mt-3">
                        <div className="flex items-center gap-1 text-yellow-500">
                          {[...Array(5)].map((_, i) => {
                            const rating = bookInfo.rating > 5 ? bookInfo.rating / 2 : bookInfo.rating;
                            return (
                              <Star
                                key={i}
                                size={14}
                                fill={i < Math.floor(rating) ? 'currentColor' : 'none'}
                              />
                            );
                          })}
                        </div>
                        <span className="text-sm font-bold">{bookInfo.rating}</span>
                        <span className="text-xs text-muted-foreground">豆瓣评分</span>
                      </div>
                    )}

                    {/* 出版信息 */}
                    <div className="mt-4 text-sm text-muted-foreground space-y-1">
                      {bookInfo.publisher && (
                        <p>出版社：{bookInfo.publisher}</p>
                      )}
                      {bookInfo.isbn && (
                        <p>ISBN：{bookInfo.isbn}</p>
                      )}
                      {bookInfo.readingDate && (
                        <p>阅读日期：{bookInfo.readingDate}</p>
                      )}
                    </div>
                  </div>
                </div>

                {/* 内容简介 */}
                {bookInfo.summary && (
                  <div className="mb-6">
                    <div className={`flex items-center gap-2 text-sm font-bold uppercase tracking-wide mb-3 ${theme.accent}`}>
                      <Book className="w-4 h-4" />
                      内容简介
                    </div>
                    <div className="p-4 rounded-xl bg-muted/30 border border-border/50">
                      <p className="text-foreground/80 leading-relaxed whitespace-pre-wrap">
                        {bookInfo.summary}
                      </p>
                    </div>
                  </div>
                )}

                {/* 读书笔记/评论 */}
                {bookInfo.review && (
                  <div className="mb-6">
                    <div className="flex items-center gap-2 text-sm font-bold text-green-600 dark:text-green-400 uppercase tracking-wide mb-3">
                      <MessageCircle className="w-4 h-4" />
                      读书笔记
                    </div>
                    <p className="text-muted-foreground leading-relaxed whitespace-pre-wrap">
                      {bookInfo.review}
                    </p>
                  </div>
                )}

                {/* 推荐人信息和完整分享内容（来自年度书单） */}
                {book.name && (
                  <div className="pt-4 border-t border-border/50">
                    <div className="flex items-center gap-2 text-sm font-bold text-blue-600 dark:text-blue-400 uppercase tracking-wide mb-3">
                      <User className="w-4 h-4" />
                      年度书单推荐
                    </div>
                    <div className="flex items-center gap-3 mb-4">
                      <div
                        className="w-10 h-10 rounded-full flex items-center justify-center font-bold text-white text-sm"
                        style={{ backgroundColor: theme.primary }}
                      >
                        {book.name?.charAt(0) || '?'}
                      </div>
                      <div>
                        <div className="font-bold text-base" style={{ color: theme.primary }}>{book.name}</div>
                        <div className="text-xs text-muted-foreground">{book.dateCreated} 推荐</div>
                      </div>
                    </div>

                    {/* 推荐理由 */}
                    {book.reason && (
                      <div className="mb-4">
                        <div className={`flex items-center gap-2 text-sm font-bold uppercase tracking-wide mb-2 ${theme.accent}`}>
                          <Sparkles className="w-4 h-4" />
                          推荐理由
                        </div>
                        <p className="text-muted-foreground leading-relaxed whitespace-pre-wrap">
                          {book.reason}
                        </p>
                      </div>
                    )}

                    {/* 精彩节选 */}
                    {book.excerpt && (
                      <div className="mb-4 p-4 rounded-xl border" style={{ backgroundColor: `${theme.primary}08`, borderColor: `${theme.primary}20` }}>
                        <div className={`flex items-center gap-2 text-sm font-bold uppercase tracking-wide mb-2 ${theme.accent}`}>
                          <Quote className="w-4 h-4" />
                          精彩节选
                        </div>
                        <p className="italic text-foreground/80 leading-relaxed font-serif whitespace-pre-wrap">
                          "{book.excerpt}"
                        </p>
                      </div>
                    )}

                    {/* 阅读后的改变 */}
                    {book.change && (
                      <div className="mb-4">
                        <div className="flex items-center gap-2 text-sm font-bold text-green-600 dark:text-green-400 uppercase tracking-wide mb-2">
                          <Heart className="w-4 h-4" />
                          阅读后的改变
                        </div>
                        <p className="text-muted-foreground leading-relaxed whitespace-pre-wrap">
                          {book.change}
                        </p>
                      </div>
                    )}

                    {/* 想安利给 */}
                    {book.recommendTo && (
                      <div className="mb-2">
                        <div className="flex items-center gap-2 text-sm font-bold text-purple-600 dark:text-purple-400 uppercase tracking-wide mb-2">
                          <MessageCircle className="w-4 h-4" />
                          想安利给
                        </div>
                        <p className="text-muted-foreground/80 italic">
                          {book.recommendTo}
                        </p>
                      </div>
                    )}
                  </div>
                )}
              </>
            ) : null}
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
};

/**
 * 年度书单详情页组件
 * 全屏展示群友推荐的书籍列表
 */
const AnnualReadingListPage = ({ data, onClose }) => {
  const [selectedBook, setSelectedBook] = useState(null);

  if (!data) return null;

  const theme = YEAR_THEMES[data.year] || YEAR_THEMES['default'];

  return (
    <>
      <motion.div
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: -20 }}
        className="fixed inset-0 z-50 bg-background flex flex-col overflow-hidden"
      >
        <ScrollArea className="flex-1">
          {/* Hero Section */}
          <div className="relative min-h-[40vh] md:min-h-[50vh] w-full overflow-hidden pb-8">
            {/* Background */}
            <div className={`absolute inset-0 bg-gradient-to-br ${theme.gradient} ${theme.darkGradient}`} />
            <div className="absolute inset-0 bg-gradient-to-b from-transparent via-background/50 to-background" />

            {/* Decorative Circles */}
            <div className={`absolute -right-20 -top-20 w-96 h-96 rounded-full bg-gradient-to-br ${theme.decorCircle} blur-3xl`} />
            <div className={`absolute -left-20 bottom-0 w-80 h-80 rounded-full bg-gradient-to-tr ${theme.decorCircle} blur-3xl`} />

            {/* Content */}
            <div className="relative h-full max-w-7xl mx-auto px-4 md:px-10 flex flex-col justify-end pt-20 md:pt-24 pb-8 md:pb-12">
              {/* Close Button */}
              <Button
                variant="ghost"
                size="icon"
                className="absolute top-4 left-4 md:top-10 md:left-10 rounded-full bg-background/20 backdrop-blur-md hover:bg-background/40 z-10"
                onClick={onClose}
              >
                <X size={24} />
              </Button>

              <motion.div
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.2 }}
                className="text-center md:text-left"
              >
                <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-full ${theme.badge} mb-6`}>
                  <Sparkles className="w-4 h-4" />
                  <span className="text-sm font-bold">
                    年度书单
                  </span>
                </div>

                <h1 className="text-4xl md:text-6xl font-black font-serif tracking-tight mb-4 leading-tight">
                  {data.title || `${data.year} 年度书单`}
                </h1>

                <p className="text-lg md:text-xl text-muted-foreground font-medium max-w-2xl">
                  {data.description || '群友们推荐的年度之书'}
                </p>

                <div className="flex items-center justify-center md:justify-start gap-6 mt-8">
                  <div className="flex items-center gap-2">
                    <div className="w-10 h-10 rounded-full flex items-center justify-center" style={{ backgroundColor: `${theme.primary}20` }}>
                      <Book className="w-5 h-5" style={{ color: theme.primary }} />
                    </div>
                    <div>
                      <div className="text-2xl font-black">{data.items?.length || 0}</div>
                      <div className="text-xs text-muted-foreground font-medium">推荐书籍</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-10 h-10 rounded-full flex items-center justify-center" style={{ backgroundColor: `${theme.primary}15` }}>
                      <User className="w-5 h-5" style={{ color: theme.primary }} />
                    </div>
                    <div>
                      <div className="text-2xl font-black">
                        {new Set(data.items?.map(item => item.name)).size || 0}
                      </div>
                      <div className="text-xs text-muted-foreground font-medium">推荐人</div>
                    </div>
                  </div>
                </div>
              </motion.div>
            </div>
          </div>

          {/* Book List */}
          <div className="max-w-7xl mx-auto px-4 md:px-10 py-10 md:py-16 pb-32">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8">
              {data.items?.map((item, idx) => (
                <motion.div
                  key={item.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.05 }}
                  className="group relative bg-muted/20 hover:bg-muted/40 rounded-3xl border border-border/50 hover:border-primary/20 transition-all overflow-hidden cursor-pointer"
                  onClick={() => setSelectedBook(item)}
                >
                  {/* 新布局：左侧封面 + 右侧内容 */}
                  <div className="flex">
                    {/* 封面区域 */}
                    <div className="w-28 md:w-36 flex-shrink-0 p-4">
                      <div className="aspect-[3/4] rounded-xl overflow-hidden bg-muted shadow-lg group-hover:shadow-xl transition-shadow">
                        {item.coverUrl ? (
                          <img
                            src={item.coverUrl}
                            alt={item.bookTitle}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br" style={{ background: `linear-gradient(135deg, ${theme.primary}30, ${theme.primary}10)` }}>
                            <Book className="w-10 h-10" style={{ color: theme.primary, opacity: 0.5 }} />
                          </div>
                        )}
                      </div>
                    </div>

                    {/* 内容区域 */}
                    <div className="flex-1 p-4 md:p-6 pl-0">
                      {/* 分享人信息（凸显） */}
                      <div className="flex items-center gap-3 mb-3">
                        <div className="w-8 h-8 rounded-full flex items-center justify-center font-bold text-white text-sm" style={{ backgroundColor: theme.primary }}>
                          {item.name?.charAt(0) || '?'}
                        </div>
                        <div>
                          <div className="font-bold text-base" style={{ color: theme.primary }}>{item.name}</div>
                          <div className="text-xs text-muted-foreground">{item.dateCreated}</div>
                        </div>
                      </div>

                      {/* 书名 - 可点击 */}
                      <h3
                        className="text-lg md:text-xl font-bold font-serif mb-3 leading-tight line-clamp-2 cursor-pointer hover:underline"
                        onClick={() => setSelectedBook(item)}
                      >
                        {item.bookTitle}
                      </h3>

                      {/* 推荐理由 */}
                      {item.reason && (
                        <div className="mb-3">
                          <div className={`flex items-center gap-2 text-xs font-bold uppercase tracking-wide mb-1 ${theme.accent}`}>
                            <Sparkles className="w-3 h-3" />
                            推荐理由
                          </div>
                          <p className="text-sm text-muted-foreground leading-relaxed line-clamp-3">
                            {item.reason}
                          </p>
                        </div>
                      )}

                      {/* 精彩节选 */}
                      {item.excerpt && (
                        <div className="p-3 rounded-xl border mb-3" style={{ backgroundColor: `${theme.primary}08`, borderColor: `${theme.primary}15` }}>
                          <div className={`flex items-center gap-2 text-xs font-bold uppercase tracking-wide mb-1 ${theme.accent}`}>
                            <Quote className="w-3 h-3" />
                            精彩节选
                          </div>
                          <p className="text-xs italic text-foreground/80 leading-relaxed line-clamp-2 font-serif">
                            "{item.excerpt}"
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>

            {/* Empty State */}
            {(!data.items || data.items.length === 0) && (
              <div className="py-32 flex flex-col items-center justify-center border-2 border-dashed rounded-3xl opacity-30 text-center">
                <Book size={48} className="mb-4" />
                <p className="text-xl font-serif">暂无年度书单数据</p>
              </div>
            )}
          </div>
        </ScrollArea>
      </motion.div>

      {/* 书籍详情弹窗 - 显示豆瓣信息 */}
      <BookDetailDialog
        book={selectedBook}
        open={selectedBook !== null}
        onClose={() => setSelectedBook(null)}
        theme={theme}
      />
    </>
  );
};

export default AnnualReadingListPage;
