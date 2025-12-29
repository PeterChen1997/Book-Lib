import React from 'react';
import { X, Book, User, Quote, Sparkles, MessageCircle, Heart } from 'lucide-react';
import { motion } from 'framer-motion';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { ScrollArea } from './ui/scroll-area';

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
 * 年度书单详情页组件
 * 全屏展示群友推荐的书籍列表
 */
const AnnualReadingListPage = ({ data, onClose }) => {
  if (!data) return null;

  const theme = YEAR_THEMES[data.year] || YEAR_THEMES['default'];

  return (
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
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center`} style={{ backgroundColor: `${theme.primary}20` }}>
                    <Book className="w-5 h-5" style={{ color: theme.primary }} />
                  </div>
                  <div>
                    <div className="text-2xl font-black">{data.items?.length || 0}</div>
                    <div className="text-xs text-muted-foreground font-medium">推荐书籍</div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center`} style={{ backgroundColor: `${theme.primary}15` }}>
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
                className="group relative bg-muted/20 hover:bg-muted/40 rounded-3xl border border-border/50 hover:border-primary/20 transition-all overflow-hidden"
              >
                {/* 新布局：左侧封面 + 右侧内容 */}
                <div className="flex">
                  {/* 封面区域 */}
                  <div className="w-28 md:w-36 flex-shrink-0 p-4">
                    <div className="aspect-[3/4] rounded-xl overflow-hidden bg-muted shadow-lg">
                      {item.coverUrl ? (
                        <img 
                          src={item.coverUrl} 
                          alt={item.bookTitle}
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            e.target.style.display = 'none';
                            e.target.parentElement.innerHTML = `<div class="w-full h-full flex items-center justify-center bg-gradient-to-br from-muted to-muted/50"><span class="text-4xl">📚</span></div>`;
                          }}
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

                    {/* 书名 */}
                    <h3 className="text-lg md:text-xl font-bold font-serif mb-3 leading-tight line-clamp-2">
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

                    {/* 阅读后的改变 */}
                    {item.change && (
                      <div className="mb-2">
                        <div className="flex items-center gap-2 text-xs font-bold text-green-600 dark:text-green-400 uppercase tracking-wide mb-1">
                          <Heart className="w-3 h-3" />
                          阅读后的改变
                        </div>
                        <p className="text-xs text-muted-foreground leading-relaxed line-clamp-2">
                          {item.change}
                        </p>
                      </div>
                    )}

                    {/* 想安利给 */}
                    {item.recommendTo && (
                      <div className="pt-2 border-t border-border/30">
                        <div className="flex items-center gap-2 text-xs font-bold text-blue-600 dark:text-blue-400 uppercase tracking-wide mb-1">
                          <MessageCircle className="w-3 h-3" />
                          想安利给
                        </div>
                        <p className="text-xs text-muted-foreground/80 italic line-clamp-1">
                          {item.recommendTo}
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
  );
};

export default AnnualReadingListPage;
