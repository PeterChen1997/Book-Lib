import React, { useState, useEffect, useRef } from 'react';
import { 
  Home, Library, Clock, CheckCircle2, Book, Music, FileText, 
  Search, Plus, MoreHorizontal, ChevronRight, X, Edit3, Save, Trash2, Upload, User,
  Moon, Sun, Laptop, Star, Menu
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  HashRouter as Router, 
  Routes, 
  Route, 
  useNavigate, 
  useParams,
  useLocation
} from 'react-router-dom';

// --- Shadcn UI Components ---
import { Button } from './components/ui/button';
import { Card, CardContent } from './components/ui/card';
import { Input } from './components/ui/input';
import { Textarea } from './components/ui/textarea';
import { Label } from './components/ui/label';
import { 
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger 
} from './components/ui/dialog';
import { Separator } from './components/ui/separator';
import { Badge } from './components/ui/badge';
import { Tabs, TabsList, TabsTrigger, TabsContent } from './components/ui/tabs';
import { ScrollArea } from './components/ui/scroll-area';
import { cn } from './lib/utils';
import { ScrollToTop } from './components/ui/scroll-to-top';
import AnnualReadingListBanner from './components/AnnualReadingListBanner';
import AnnualReadingListPage from './components/AnnualReadingListPage';
import { normalizeCoverUrl } from './utils/coverUrl';

const API_URL = '/api';
const IMG_BASE = '';

// --- Theme Hook ---
const useTheme = () => {
  const [theme, setTheme] = useState(() => {
    const saved = localStorage.getItem('theme');
    if (saved) return saved;
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  });

  useEffect(() => {
    const root = window.document.documentElement;
    root.classList.remove('light', 'dark');
    root.classList.add(theme);
    localStorage.setItem('theme', theme);
  }, [theme]);

  const toggleTheme = (val) => setTheme(val);
  return { theme, toggleTheme };
};

const Quote = ({ className }) => (
  <svg className={className} width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
    <path d="M14.017 21L14.017 18C14.017 16.8954 14.9124 16 16.017 16H19.017C19.5693 16 20.017 15.5523 20.017 15V9C20.017 8.44772 19.5693 8 19.017 8H16.017C14.9124 8 14.017 7.10457 14.017 6V4H19.017C20.1216 4 21.017 4.89543 21.017 6V15C21.017 17.2091 19.2261 19 17.017 19H14.017V21H14.017ZM3.01697 21L3.01697 18C3.01697 16.8954 3.9124 16 5.01697 16H8.01697C8.56925 16 9.01697 15.5523 9.01697 15V9C9.01697 8.44772 8.56925 8 8.01697 8H5.01697C3.9124 8 3.01697 7.10457 3.01697 6V4H8.01697C9.12154 4 10.017 4.89543 10.017 6V15C10.017 17.2091 8.22611 19 6.01697 19H3.01697V21H3.01697Z" />
  </svg>
);

// --- Book Card Component ---
const BookCard = ({ book, onClick, isBatchMode, isSelected, onToggleSelect }) => {
  const coverPath = normalizeCoverUrl(book.coverUrl) || 'https://via.placeholder.com/300x420?text=No+Cover';

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ scale: isBatchMode ? 1 : 1.05 }}
      whileTap={{ scale: 0.98 }}
      className={cn(
        "group cursor-pointer flex flex-col gap-3 relative",
        isSelected && "ring-2 ring-primary ring-offset-4 rounded-xl"
      )}
      onClick={() => isBatchMode ? onToggleSelect(book.id) : onClick(book)}
    >
      <div className="relative book-spine-shadow aspect-[3/4.2] rounded-md overflow-hidden bg-muted">
        <img 
          src={coverPath} 
          alt={book.title} 
          className="w-full h-full object-cover transition-all group-hover:brightness-110"
          onError={(e) => { e.target.src = 'https://via.placeholder.com/300x420?text=No+Cover'; }}
        />
        <div className="absolute top-2 right-2 flex gap-1">
          {/* 在读状态标签 */}
          {book.status === '在读' && (
            <Badge className="bg-green-500/90 backdrop-blur-md border-none text-[10px] h-5 px-1.5">📖 在读</Badge>
          )}
          {book.readingDate?.startsWith('2025') && book.status !== '在读' && (
            <Badge className="bg-blue-500/80 backdrop-blur-md border-none text-[10px] h-5 px-1.5">2025</Badge>
          )}
        </div>
        
        {isBatchMode && (
          <div className={cn(
            "absolute inset-0 bg-background/20 backdrop-blur-[1px] flex items-center justify-center transition-opacity",
            isSelected ? "opacity-100" : "opacity-0 group-hover:opacity-100"
          )}>
            <div className={cn(
              "w-8 h-8 rounded-full border-2 flex items-center justify-center transition-all",
              isSelected ? "bg-primary border-primary text-primary-foreground" : "bg-background/80 border-white"
            )}>
              {isSelected && <CheckCircle2 size={20} />}
            </div>
          </div>
        )}
      </div>
      <div className="space-y-1">
        <h3 className="font-bold text-sm line-clamp-1 group-hover:text-primary transition-colors">{book.title}</h3>
        <p className="text-xs text-muted-foreground">{book.author}</p>
        <div className="flex items-center justify-between mt-1">
          <div className="flex items-center gap-1 text-yellow-500">
            {[...Array(5)].map((_, i) => {
              const rating = book.userRating || book.rating || 0;
              const displayRating = (rating > 5) ? rating / 2 : rating;
              return <Star key={i} size={10} fill={i < displayRating ? "currentColor" : "none"} />;
            })}
          </div>
          <div className="flex items-center gap-1 flex-wrap justify-end">
            {/* 用户评分 >= 9 显示力荐 */}
            {book.userRating >= 9 && (
              <span className="text-[11px] px-2 py-0.5 rounded-full font-bold bg-gradient-to-r from-red-500 to-orange-500 text-white shadow-sm">
                🔥力荐
              </span>
            )}
            {/* 豆瓣评分 >= 9 显示好书 */}
            {book.rating >= 9 && (
              <span className="text-[11px] px-2 py-0.5 rounded-full font-bold bg-gradient-to-r from-amber-500 to-yellow-500 text-white shadow-sm">
                ⭐好书
              </span>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
};

// --- Book Editor Dialog ---
const BookEditor = ({ book, onSave, onCancel, onDelete, open, setOpen }) => {
  const [formData, setFormData] = useState(book || {
    title: '', author: '', readingDate: new Date().toISOString().split('T')[0],
    status: '已读', rating: 5, userRating: 0, recommendation: '推荐',
    summary: '', review: '', quotes: [], fileUrl: '',
    totalPages: 0
  });
  const [coverFile, setCoverFile] = useState(null);
  const [newQuote, setNewQuote] = useState('');

  useEffect(() => {
    if (book) {
      // Ensure quotes is an array and readingDate is correctly set
      const quotes = Array.isArray(book.quotes) ? book.quotes : [];
      setFormData({ ...book, quotes });
    } else {
      setFormData({
        title: '', author: '', readingDate: new Date().toISOString().split('T')[0],
        status: '已读', rating: 5, summary: '', review: '', quotes: [], fileUrl: '',
        totalPages: 0
      });
    }
    setCoverFile(null);
  }, [book, open]);

  const handleSubmit = (e) => {
    e.preventDefault();
    const data = new FormData();
    Object.keys(formData).forEach(key => {
      if (key === 'quotes') {
        data.append(key, JSON.stringify(formData[key]));
      } else if (formData[key] !== null && formData[key] !== undefined) {
        data.append(key, formData[key]);
      }
    });
    if (coverFile) data.append('cover', coverFile);
    onSave(data, formData.id);
  };

  const addQuote = () => {
    if (!newQuote.trim()) return;
    setFormData({ ...formData, quotes: [...formData.quotes, { content: newQuote, id: Date.now() }] });
    setNewQuote('');
  };

  const removeQuote = (id) => {
    setFormData({ ...formData, quotes: formData.quotes.filter(q => q.id !== id) });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{book ? '优化书籍档案' : '录入新藏书'}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-6 py-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="title">书名</Label>
              <Input id="title" required value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="author">作者</Label>
              <Input id="author" required value={formData.author} onChange={e => setFormData({...formData, author: e.target.value})} />
            </div>
          </div>
          <div className="grid grid-cols-4 gap-4">
            <div className="space-y-2">
              <Label htmlFor="date">阅读日期</Label>
              <Input id="date" type="date" value={formData.readingDate} onChange={e => setFormData({...formData, readingDate: e.target.value})} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="status">阅读状态</Label>
              <select className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm" value={formData.status} onChange={e => setFormData({...formData, status: e.target.value})}>
                <option value="在读">在读</option>
                <option value="已读">已读</option>
              </select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="rating">豆瓣评分</Label>
              <Input id="rating" type="number" step="0.1" min="0" max="10" value={formData.rating} onChange={e => setFormData({...formData, rating: parseFloat(e.target.value)})} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="userRating">个人评分</Label>
              <Input id="userRating" type="number" step="0.1" min="0" max="10" value={formData.userRating} onChange={e => setFormData({...formData, userRating: parseFloat(e.target.value)})} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="recommendation">推荐程度</Label>
              <select className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm" value={formData.recommendation} onChange={e => setFormData({...formData, recommendation: e.target.value})}>
                <option value="力荐">力荐</option>
                <option value="推荐">推荐</option>
                <option value="普通">普通</option>
                <option value="不推荐">不推荐</option>
              </select>
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="fileUrl">电子书源链接 (URL)</Label>
            <Input id="fileUrl" value={formData.fileUrl} onChange={e => setFormData({...formData, fileUrl: e.target.value})} placeholder="https://... 或本地路径" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="summary">摘要 / 简介</Label>
            <Textarea id="summary" value={formData.summary} onChange={e => setFormData({...formData, summary: e.target.value})} className="h-20" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="review">我的书评</Label>
            <Textarea id="review" value={formData.review} onChange={e => setFormData({...formData, review: e.target.value})} className="h-32" />
          </div>
          
          <div className="space-y-4">
            <Label>书摘 / 金句</Label>
            <div className="flex gap-2">
              <Input value={newQuote} onChange={e => setNewQuote(e.target.value)} placeholder="记录此刻的感悟..." />
              <Button type="button" onClick={addQuote} variant="secondary">添加</Button>
            </div>
            <div className="space-y-2">
              {formData.quotes?.map((quote, idx) => (
                <div key={quote.id || idx} className="flex items-center justify-between p-2 bg-muted rounded-md text-sm italic group">
                  <span className="line-clamp-2">“{quote.content}”</span>
                  <Button type="button" variant="ghost" size="icon" className="h-6 w-6 opacity-0 group-hover:opacity-100" onClick={() => removeQuote(quote.id || idx)}>
                    <X size={12} />
                  </Button>
                </div>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <Label>封面图片</Label>
            <div className="flex items-center gap-4">
              <Input type="file" accept="image/*" onChange={e => setCoverFile(e.target.files[0])} className="w-full cursor-pointer" />
              {book?.coverUrl && !coverFile && <Badge variant="secondary">已有封面</Badge>}
            </div>
          </div>
          <DialogFooter className="pt-4 gap-2">
            {book && (
              <Button type="button" variant="destructive" onClick={() => onDelete(book.id)}>
                <Trash2 className="w-4 h-4 mr-2" /> 删除
              </Button>
            )}
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>取消</Button>
            <Button type="submit">完成录入</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

// --- Fullscreen Book Detail Component ---
const BookFullscreenDetail = ({ 
  book, 
  isAdmin, 
  onOpenEditor, 
  onClose,
  selectedBookNotes,
  handleDeleteNote,
  isImportingNotes, setIsImportingNotes, importText, setImportText, handleImportNotes
}) => {
  const detailScrollRef = React.useRef(null);
  if (!book) return null;
  
  const coverPath = normalizeCoverUrl(book.coverUrl) || 'https://via.placeholder.com/300x420?text=No+Cover';

  return (
    <motion.div 
      initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}
      className="fixed inset-0 z-50 bg-background flex flex-col overflow-hidden"
    >
      {/* Scrollable Container */}
      <ScrollArea className="flex-1" viewportRef={detailScrollRef}>
        {/* Hero Section */}
        <div className="relative min-h-[70vh] md:min-h-[500px] w-full overflow-hidden pb-8">
          <div 
            className="absolute inset-0 bg-cover bg-center scale-110 blur-3xl opacity-20"
            style={{ backgroundImage: `url(${coverPath})` }}
          />
          <div className="absolute inset-0 bg-gradient-to-b from-transparent via-background/50 to-background" />
          
          <div className="relative h-full max-w-7xl mx-auto px-4 md:px-10 flex flex-col md:flex-row items-center md:items-end pt-20 md:pt-20 pb-6 md:pb-12 gap-6 md:gap-12">
            <motion.div 
              initial={{ y: 40, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.2 }}
              className="w-40 md:w-64 flex-shrink-0"
            >
              <img 
                src={coverPath} 
                className="w-full book-spine-shadow rounded-lg shadow-2xl" 
                alt={book.title}
                onError={(e) => { e.target.src = 'https://via.placeholder.com/300x420?text=No+Cover'; }}
              />
            </motion.div>
            
            <div className="flex-1 space-y-4 md:space-y-6 mb-4 text-center md:text-left">
              <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.3 }}>
                <div className="flex items-center justify-center md:justify-start gap-3 mb-4">
                  <Badge variant="secondary" className="bg-primary/10 text-primary border-none text-xs px-3 py-1">
                    {book.status}
                  </Badge>
                  <span className="text-muted-foreground text-sm font-medium">{book.readingDate}</span>
                </div>
                <h1 className="text-3xl md:text-6xl font-black font-serif tracking-tighter mb-4 leading-tight md:leading-none flex flex-col md:flex-row items-center gap-3 md:gap-4">
                  {book.title}
                  {book.recommendation && (
                    <Badge className={cn(
                      "px-3 md:px-4 py-1 md:py-1.5 text-[10px] md:text-xs font-black uppercase tracking-widest rounded-full border-none",
                      book.recommendation === '力荐' ? "bg-red-500 text-white shadow-lg shadow-red-500/20" :
                      book.recommendation === '推荐' ? "bg-green-500 text-white shadow-lg shadow-green-500/20" :
                      book.recommendation === '普通' ? "bg-blue-500 text-white shadow-lg shadow-blue-500/20" :
                      "bg-muted text-muted-foreground"
                    )}>
                      {book.recommendation}
                    </Badge>
                  )}
                </h1>
                <p className="text-lg md:text-2xl text-muted-foreground font-medium italic">
                  — {book.author}
                </p>
              </motion.div>
              
              <div className="flex items-center gap-8 pt-4">
                <div className="flex flex-col gap-1">
                  <span className="text-[10px] uppercase font-black tracking-widest text-muted-foreground opacity-60">Personal</span>
                  <div className="flex items-center gap-1 text-yellow-500">
                    {[...Array(5)].map((_, i) => {
                      const rating = book.userRating || 0;
                      const displayRating = (rating > 5) ? rating / 2 : rating;
                      return <Star key={i} size={20} fill={i < displayRating ? "currentColor" : "none"} />;
                    })}
                  </div>
                </div>
                <div className="h-10 w-px bg-border/20" />
                <div className="flex flex-col gap-1">
                  <span className="text-[10px] uppercase font-black tracking-widest text-muted-foreground opacity-60">Douban</span>
                  <div className="flex items-center gap-1 text-primary/40">
                    {[...Array(5)].map((_, i) => {
                      const displayRating = (book.rating > 5) ? book.rating / 2 : book.rating;
                      return <Star key={i} size={16} fill={i < displayRating ? "currentColor" : "none"} />;
                    })}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Floating Action Bar */}
          <div className="absolute top-4 md:top-10 right-4 md:right-10 left-4 md:left-10 flex justify-between items-center z-10">
            <Button variant="ghost" size="icon" className="rounded-full bg-background/20 backdrop-blur-md hover:bg-background/40" onClick={onClose}>
              <X size={24} />
            </Button>
            <div className="flex gap-3">
              {book.fileUrl && (
                <Button variant="secondary" className="rounded-full bg-background/20 backdrop-blur-md" onClick={() => window.open(book.fileUrl)}>
                  <FileText className="w-4 h-4 mr-2" /> 阅读原文
                </Button>
              )}
            </div>
          </div>
        </div>

        {/* Content Section */}
        <div className="max-w-7xl mx-auto px-4 md:px-10 py-10 md:py-20 pb-32 md:pb-40">
          <Tabs defaultValue="overview" className="w-full">
            <TabsList className="w-full md:w-fit mb-8 md:mb-16 bg-muted/30 p-1 rounded-2xl md:rounded-full h-12 md:h-14 border border-border/50 flex">
              <TabsTrigger value="overview" className="flex-1 md:flex-none rounded-xl md:rounded-full px-3 md:px-8 h-full data-[state=active]:bg-background data-[state=active]:shadow-lg text-xs md:text-base">概要</TabsTrigger>
              <TabsTrigger value="notes" className="flex-1 md:flex-none rounded-xl md:rounded-full px-3 md:px-8 h-full data-[state=active]:bg-background data-[state=active]:shadow-lg text-xs md:text-base">笔记 ({selectedBookNotes.length})</TabsTrigger>
              <TabsTrigger value="quotes" className="flex-1 md:flex-none rounded-xl md:rounded-full px-3 md:px-8 h-full data-[state=active]:bg-background data-[state=active]:shadow-lg text-xs md:text-base">金句 ({book.quotes?.length || 0})</TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="outline-none space-y-8 md:space-y-24">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-16">
                {/* 阅读评分 - 移动端在前 */}
                <div className="order-first md:order-last">
                   <section className="bg-gradient-to-br from-primary/5 via-background to-primary/5 p-3 md:p-5 rounded-xl md:rounded-2xl border border-primary/10 shadow-inner shadow-black/5">
                      <Label className="text-[10px] md:text-xs uppercase font-black tracking-[0.1em] text-primary/60 mb-2 md:mb-4 block italic flex items-center gap-2">
                        <span className="w-1.5 h-1.5 md:w-2 md:h-2 rounded-full bg-primary animate-pulse" />
                        阅读评分
                      </Label>
                      {/* 移动端紧凑横向布局 */}
                      <div className="flex md:hidden gap-2">
                        {/* 个人评分 */}
                        <div className={cn(
                          "flex-1 p-2.5 rounded-lg border",
                          book.userRating >= 9 ? "bg-gradient-to-br from-emerald-500/20 to-emerald-600/10 border-emerald-500/30" :
                          book.userRating >= 8 ? "bg-gradient-to-br from-green-500/20 to-green-600/10 border-green-500/30" :
                          book.userRating >= 7 ? "bg-gradient-to-br from-blue-500/20 to-blue-600/10 border-blue-500/30" :
                          book.userRating >= 6 ? "bg-gradient-to-br from-yellow-500/20 to-yellow-600/10 border-yellow-500/30" :
                          "bg-background/50 border-border/50"
                        )}>
                          <div className="text-[10px] font-bold text-muted-foreground mb-0.5">✍️ 个人</div>
                          <div className={cn(
                            "text-2xl font-black",
                            book.userRating >= 9 ? "text-emerald-500" :
                            book.userRating >= 8 ? "text-green-500" :
                            book.userRating >= 7 ? "text-blue-500" :
                            book.userRating >= 6 ? "text-yellow-500" :
                            "text-foreground"
                          )}>
                            {book.userRating || '-'}
                            <span className="text-[10px] font-medium opacity-40">/10</span>
                          </div>
                        </div>
                        {/* 豆瓣评分 */}
                        <div className="flex-1 p-2.5 bg-background/50 rounded-lg border border-border/50">
                          <div className="text-[10px] font-bold text-muted-foreground mb-0.5">📖 豆瓣</div>
                          <div className="text-2xl font-black text-muted-foreground">
                            {book.rating || '-'}
                            <span className="text-[10px] font-medium opacity-40">/10</span>
                          </div>
                        </div>
                        {/* 推荐程度 - 仅在有推荐时显示 */}
                        {book.recommendation && (
                          <div className={cn(
                            "flex-1 p-2.5 rounded-lg border flex flex-col justify-center items-center",
                            book.recommendation === '力荐' ? "bg-gradient-to-br from-red-500/20 to-rose-500/10 border-red-500/30" :
                            book.recommendation === '推荐' ? "bg-gradient-to-br from-green-500/20 to-teal-500/10 border-green-500/30" :
                            "bg-muted/30 border-border/50"
                          )}>
                            <span className="text-lg mb-0.5">
                              {book.recommendation === '力荐' ? "🔥" :
                               book.recommendation === '推荐' ? "👍" :
                               book.recommendation === '普通' ? "🤔" : "👎"}
                            </span>
                            <span className={cn(
                              "text-[10px] font-bold px-1.5 py-0.5 rounded-full",
                              book.recommendation === '力荐' ? "bg-red-500 text-white" :
                              book.recommendation === '推荐' ? "bg-green-500 text-white" :
                              "bg-muted text-muted-foreground"
                            )}>
                              {book.recommendation}
                            </span>
                          </div>
                        )}
                      </div>
                      {/* 桌面端原有布局 */}
                      <div className="hidden md:block space-y-3">
                          <div className={cn(
                            "p-4 rounded-xl border relative overflow-hidden",
                            book.userRating >= 9 ? "bg-gradient-to-br from-emerald-500/20 to-emerald-600/10 border-emerald-500/30" :
                            book.userRating >= 8 ? "bg-gradient-to-br from-green-500/20 to-green-600/10 border-green-500/30" :
                            book.userRating >= 7 ? "bg-gradient-to-br from-blue-500/20 to-blue-600/10 border-blue-500/30" :
                            book.userRating >= 6 ? "bg-gradient-to-br from-yellow-500/20 to-yellow-600/10 border-yellow-500/30" :
                            book.userRating >= 5 ? "bg-gradient-to-br from-orange-500/20 to-orange-600/10 border-orange-500/30" :
                            "bg-background/50 border-border/50"
                          )}>
                            <div className="flex items-center justify-between">
                              <div>
                                <div className="text-xs font-bold text-muted-foreground mb-1 flex items-center gap-2">
                                  <span>✍️</span> 个人评分
                                </div>
                                <div className={cn(
                                  "text-5xl font-black tracking-tight",
                                  book.userRating >= 9 ? "text-emerald-500" :
                                  book.userRating >= 8 ? "text-green-500" :
                                  book.userRating >= 7 ? "text-blue-500" :
                                  book.userRating >= 6 ? "text-yellow-500" :
                                  book.userRating >= 5 ? "text-orange-500" :
                                  "text-foreground"
                                )}>
                                  {book.userRating || '-'}
                                  <span className="text-base font-medium opacity-40 ml-1">/ 10</span>
                                </div>
                              </div>
                              {book.userRating && (
                                <div className={cn(
                                  "text-4xl opacity-30",
                                  book.userRating >= 9 ? "text-emerald-500" :
                                  book.userRating >= 8 ? "text-green-500" :
                                  book.userRating >= 7 ? "text-blue-500" :
                                  book.userRating >= 6 ? "text-yellow-500" :
                                  "text-orange-500"
                                )}>
                                  {book.userRating >= 9 ? "🌟" : book.userRating >= 8 ? "⭐" : book.userRating >= 7 ? "👍" : book.userRating >= 6 ? "👌" : "🤔"}
                                </div>
                              )}
                            </div>
                          </div>

                          {/* Douban Rating */}
                          <div className="p-3 bg-background/50 backdrop-blur-sm rounded-lg border border-border/50 flex items-center justify-between">
                            <div>
                              <div className="text-xs font-bold text-muted-foreground mb-0.5 flex items-center gap-2">
                                <span>📖</span> 豆瓣评分
                              </div>
                              <div className="text-2xl font-black text-muted-foreground">
                                {book.rating || '-'}
                                <span className="text-xs font-medium opacity-40 ml-1">/ 10</span>
                              </div>
                            </div>
                            <div className="flex items-center gap-0.5 text-yellow-500/60">
                              {[...Array(5)].map((_, i) => {
                                const displayRating = (book.rating > 5) ? book.rating / 2 : book.rating;
                                return <Star key={i} size={16} fill={i < displayRating ? "currentColor" : "none"} />;
                              })}
                            </div>
                          </div>

                          {/* Recommendation */}
                          <div className={cn(
                            "p-4 rounded-lg border flex items-center gap-3",
                            book.recommendation === '力荐' ? "bg-gradient-to-r from-red-500/20 via-pink-500/15 to-rose-500/10 border-red-500/30" :
                            book.recommendation === '推荐' ? "bg-gradient-to-r from-green-500/20 via-emerald-500/15 to-teal-500/10 border-green-500/30" :
                            book.recommendation === '普通' ? "bg-gradient-to-r from-blue-500/20 via-sky-500/15 to-cyan-500/10 border-blue-500/30" :
                            book.recommendation === '不推荐' ? "bg-gradient-to-r from-gray-500/20 via-slate-500/15 to-zinc-500/10 border-gray-500/30" :
                            "bg-muted/30 border-border/50"
                          )}>
                            <span className="text-2xl">
                              {book.recommendation === '力荐' ? "🔥" :
                               book.recommendation === '推荐' ? "👍" :
                               book.recommendation === '普通' ? "🤔" :
                               book.recommendation === '不推荐' ? "👎" : "❓"}
                            </span>
                            <div className="flex-1">
                              <div className="text-xs font-bold text-muted-foreground mb-1">推荐程度</div>
                              <div className="flex items-center gap-2">
                                <span className={cn(
                                  "px-3 py-1 rounded-full text-sm font-black",
                                  book.recommendation === '力荐' ? "bg-red-500 text-white shadow-lg shadow-red-500/30" :
                                  book.recommendation === '推荐' ? "bg-green-500 text-white shadow-lg shadow-green-500/30" :
                                  book.recommendation === '普通' ? "bg-blue-500 text-white shadow-lg shadow-blue-500/30" :
                                  book.recommendation === '不推荐' ? "bg-gray-500 text-white" :
                                  "bg-muted text-muted-foreground"
                                )}>
                                  {book.recommendation || '未设定'}
                                </span>
                                {book.recommendation === '力荐' && <span className="text-sm text-red-400 font-medium">年度推荐!</span>}
                              </div>
                            </div>
                          </div>
                      </div>
                   </section>
                </div>

                {/* 内容区域 */}
                <div className="md:col-span-2 space-y-8 md:space-y-12 order-last md:order-first">
                  <section>
                    <Label className="text-xs uppercase font-black tracking-[0.2em] text-primary mb-4 md:mb-6 block">Content Summary</Label>
                    <div className="relative ml-4 md:ml-0">
                      <div className="absolute -left-4 md:-left-6 top-0 bottom-0 w-1 bg-primary/20 rounded-full" />
                      <p className="text-base md:text-xl leading-relaxed text-muted-foreground font-serif pl-0">
                        {book.summary || "尚未添加书籍摘要。"}
                      </p>
                    </div>
                  </section>
                  <section>
                    <Label className="text-xs uppercase font-black tracking-[0.2em] text-primary mb-4 md:mb-6 block">Personal Review</Label>
                    <div className="relative p-4 md:p-12 ml-4 md:ml-0 bg-muted/20 rounded-xl md:rounded-[3rem] border border-border/50 italic shadow-inner shadow-black/5">
                      <Quote className="absolute -top-3 left-1 md:-top-6 md:-left-6 w-8 h-8 md:w-16 md:h-16 text-primary/10 rotate-180" />
                      <span className="absolute top-3 right-4 md:top-8 md:right-12 text-3xl md:text-6xl font-serif text-primary/5 select-none">评</span>
                      <p className="text-base md:text-2xl leading-loose whitespace-pre-wrap font-serif relative z-10">
                        {book.review || "暂未撰写书评。"}
                      </p>
                    </div>
                  </section>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="notes" className="outline-none">
              <div className="flex justify-between items-center mb-12">
                 <div>
                   <h3 className="text-3xl font-serif font-bold">笔记流</h3>
                   <p className="text-muted-foreground mt-2">书中的灵光现，记录在此间。</p>
                 </div>
              </div>

              {selectedBookNotes.length === 0 ? (
                <div className="py-32 flex flex-col items-center justify-center border-2 border-dashed rounded-[3rem] opacity-30 text-center">
                  <FileText size={48} className="mb-4" />
                  <p className="text-xl font-serif">此书尚无笔记</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                  {selectedBookNotes.map((note, idx) => (
                    <motion.div 
                      key={note.id}
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: idx * 0.05 }}
                      className="group p-8 bg-muted/10 hover:bg-muted/30 transition-all rounded-[2rem] border border-border/20 hover:border-primary/20 relative"
                    >
                      <p className="text-lg leading-relaxed font-serif text-foreground/80 whitespace-pre-wrap mb-10">
                        {note.content}
                      </p>
                      <div className="absolute bottom-6 left-8 right-8 flex items-center">
                        <span className="text-[10px] font-mono font-bold tracking-widest text-muted-foreground uppercase">
                          {new Date(note.created_at).toLocaleDateString()}
                        </span>
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </TabsContent>

            <TabsContent value="quotes" className="outline-none">
               <div className="columns-1 md:columns-2 lg:columns-3 gap-8 space-y-8">
                 {book.quotes?.map((quote, idx) => {
                   const quoteText = typeof quote === 'string' ? quote : quote.content;
                   return (
                     <div key={idx} className="break-inside-avoid p-6 md:p-10 bg-primary/5 rounded-2xl md:rounded-[2.5rem] border border-primary/10 relative overflow-hidden group">
                       <span className="absolute -top-4 -right-4 text-6xl md:text-8xl font-serif text-primary/10 select-none">"</span>
                       <p className="text-base md:text-xl italic font-serif leading-loose relative z-10 text-foreground/90">
                         "{quoteText}"
                       </p>
                     </div>
                   );
                 })}
                 {(!book.quotes || book.quotes.length === 0) && (
                   <p className="text-center text-muted-foreground py-20 col-span-full font-serif italic text-lg opacity-40">此书尚未收录金句。</p>
                 )}
               </div>
            </TabsContent>
          </Tabs>
        </div>
        <ScrollToTop scrollRef={detailScrollRef} />
      </ScrollArea>
    </motion.div>
  );
};


export default function AppWrapper() {
  return (
    <Router>
      <App />
    </Router>
  );
}

function App() {
  const navigate = useNavigate();
  const location = useLocation();

  // Manually parse path for parameters since App is outside the Routes
  const pathParts = location.pathname.split('/').filter(Boolean);
  const isBookRoute = pathParts[0] === 'book';
  const bookId = isBookRoute ? pathParts[1] : null;
  const isYearRoute = pathParts[0] === 'year';
  const isAnnualListRoute = pathParts[0] === 'annual-list'; // Added
  const activeTab = isYearRoute ? pathParts[1] : (isBookRoute ? 'All' : 'All');
  const annualListYear = isAnnualListRoute ? pathParts[1] : null; // Added

  const [books, setBooks] = useState([]);
  const [selectedBook, setSelectedBook] = useState(null);
  // 编辑功能已禁用 - SQLite数据在部署时可能丢失
  const isAdmin = false;
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState('latest');
  const { theme, toggleTheme } = useTheme();

  const [isBatchMode, setIsBatchMode] = useState(false);
  const [selectedBookIds, setSelectedBookIds] = useState([]);
  const [selectedBookNotes, setSelectedBookNotes] = useState([]);
  const [isImportingNotes, setIsImportingNotes] = useState(false);
  const [importText, setImportText] = useState('');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [annualLists, setAnnualLists] = useState([]);
  const [selectedAnnualList, setSelectedAnnualList] = useState(null);
  const mainScrollRef = useRef(null);

  const fetchBooks = async () => {
    try {
      const res = await fetch(`${API_URL}/books?search=${searchQuery}&sort=${sortBy}`);
      const data = await res.json();
      setBooks(data);
    } catch (err) { console.error('Data sync failed', err); }
  };

  const fetchNotes = async (bookId) => {
    try {
      const res = await fetch(`${API_URL}/books/${bookId}/notes`);
      const data = await res.json();
      setSelectedBookNotes(data);
    } catch (err) { console.error('Failed to fetch notes', err); }
  };

  useEffect(() => { fetchBooks(); }, [searchQuery, sortBy]);

  // 获取年度书单列表
  const fetchAnnualLists = async () => {
    try {
      const res = await fetch(`${API_URL}/annual-lists`);
      const data = await res.json();
      setAnnualLists(data);
    } catch (err) { console.error('Failed to fetch annual lists', err); }
  };

  // 获取指定年份的年度书单详情
  const fetchAnnualListDetail = async (year) => {
    try {
      const res = await fetch(`${API_URL}/annual-lists/${year}`);
      if (res.ok) {
        const data = await res.json();
        setSelectedAnnualList(data);
      }
    } catch (err) { console.error('Failed to fetch annual list detail', err); }
  };

  useEffect(() => { fetchAnnualLists(); }, []);

  useEffect(() => {
    if (bookId && books.length > 0) {
      const book = books.find(b => b.id.toString() === bookId);
      if (book) {
        setSelectedBook(book);
        fetchNotes(book.id);
      }
    } else {
      setSelectedBook(null);
      setSelectedBookNotes([]);
    }
  }, [bookId, books]);

  // Added useEffect for annualListYear
  useEffect(() => {
    if (annualListYear) {
      fetchAnnualListDetail(annualListYear);
    } else {
      setSelectedAnnualList(null);
    }
  }, [annualListYear]);

  const handleSave = async (formData, id) => {
    const url = id ? `${API_URL}/books/${id}` : `${API_URL}/books`;
    const method = id ? 'PUT' : 'POST';
    await fetch(url, { method, body: formData });
    fetchBooks();
    setEditorOpen(false);
    setEditingBook(null);
  };

  const handleDelete = async (id) => {
    if (window.confirm('此操作不可撤销，确认删除吗？')) {
      await fetch(`${API_URL}/books/${id}`, { method: 'DELETE' });
      fetchBooks();
      setEditorOpen(false);
      setSelectedBook(null);
    }
  };

  const handleBatchDelete = async () => {
    if (selectedBookIds.length === 0) return;
    if (window.confirm(`确定要删除选中的 ${selectedBookIds.length} 本书吗？`)) {
      await Promise.all(selectedBookIds.map(id => 
        fetch(`${API_URL}/books/${id}`, { method: 'DELETE' })
      ));
      fetchBooks();
      setSelectedBookIds([]);
      setIsBatchMode(false);
    }
  };

  const handleImportNotes = async () => {
    if (!importText.trim()) return;
    try {
      await fetch(`${API_URL}/books/${selectedBook.id}/notes/import`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: importText })
      });
      setImportText('');
      setIsImportingNotes(false);
      fetchNotes(selectedBook.id);
    } catch (err) { console.error('Import failed', err); }
  };

  const handleDeleteNote = async (noteId) => {
    if (window.confirm('确认删除这条笔记吗？')) {
      await fetch(`${API_URL}/notes/${noteId}`, { method: 'DELETE' });
      fetchNotes(selectedBook.id);
    }
  };

  const handleModalClose = () => {
    if (location.key === 'default') {
      navigate('/', { replace: true });
    } else {
      navigate(-1);
    }
  };


  const toggleSelectBook = (id) => {
    setSelectedBookIds(prev => 
      prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
    );
  };

  const handleOpenEditorFromDetails = (bookToEdit) => {
    setEditingBook(bookToEdit);
    setEditorOpen(true);
    handleModalClose(); // Go back to close details, or stay if you prefer
  };

  const groupBooksByYear = (booksList) => {
    const groups = {};
    booksList.forEach(book => {
      const year = book.readingDate?.split('-')[0] || '待定';
      if (!groups[year]) groups[year] = [];
      groups[year].push(book);
    });
    
    return Object.keys(groups)
      .sort((a, b) => {
        if (a === '待定') return 1;
        if (b === '待定') return -1;
        return b.localeCompare(a);
      })
      .map(year => ({ year, items: groups[year] }));
  };

  const filteredBooks = activeTab === 'All' ? books : books.filter(b => b.readingDate?.startsWith(activeTab));
  const groupedBooks = groupBooksByYear(filteredBooks);

  const availableYears = [...new Set(books.map(b => b.readingDate?.split('-')[0]))]
    .filter(Boolean)
    .sort((a, b) => b.localeCompare(a));

  return (
    <>
      <Routes>
        <Route path="/" element={<div />} />
        <Route path="/year/:year" element={<div />} />
        <Route path="/book/:bookId" element={<div />} />
        <Route path="/annual-list/:year" element={<div />} />
      </Routes>
      <div className="flex h-screen bg-background text-foreground overflow-hidden font-sans select-none">
      {/* Mobile Sidebar Overlay */}
      <AnimatePresence>
        {sidebarOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 z-40 md:hidden"
            onClick={() => setSidebarOpen(false)}
          />
        )}
      </AnimatePresence>

      {/* Sidebar */}
      <aside className={cn(
        "w-72 border-r bg-muted/20 flex flex-col p-6 backdrop-blur-3xl transition-all duration-300 z-50",
        // Desktop: normal flow, hidden when book detail is open
        "hidden md:flex",
        (selectedBook || selectedAnnualList) && "md:-translate-x-full md:absolute", // Modified
        // Mobile: fixed drawer
        sidebarOpen && "!fixed !flex inset-y-0 left-0"
      )}>
        <div className="flex items-center justify-between mb-10 px-2">
          <div className="flex items-center gap-3 font-serif font-bold text-2xl tracking-tighter">
            <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center text-primary-foreground shadow-lg shadow-primary/20">
              <Book size={20} />
            </div>
            <span>龙场书屋</span>
          </div>
          <Button variant="ghost" size="icon" className="md:hidden" onClick={() => setSidebarOpen(false)}>
            <X size={20} />
          </Button>
        </div>

        <nav className="flex-1 space-y-1">
          <p className="px-2 text-[10px] font-black text-muted-foreground uppercase tracking-widest mb-2">目录</p>
          <Button 
            variant={activeTab === 'All' ? "secondary" : "ghost"} 
            className="w-full justify-start gap-3 h-10" 
            onClick={() => { navigate('/'); setSidebarOpen(false); }}
          >
            <Library size={18} /> 全部书籍
          </Button>
          <Separator className="my-2" />
          <p className="px-2 text-[10px] font-black text-muted-foreground uppercase tracking-widest mb-2">年份检索</p>
          <ScrollArea className="h-[300px]">
            {availableYears.map(year => (
              <Button 
                key={year}
                variant={activeTab === year ? "secondary" : "ghost"} 
                className="w-full justify-start gap-3 h-10" 
                onClick={() => { navigate(`/year/${year}`); setSidebarOpen(false); }}
              >
                <Clock size={18} /> {year} 年
              </Button>
            ))}
          </ScrollArea>
        </nav>

        <div className="mt-auto pt-4 border-t space-y-4">
          <div className="flex items-center px-2">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-primary-foreground">
                <User size={16} />
              </div>
              <span className="text-sm font-semibold tracking-tight">PETER</span>
            </div>
          </div>
          
          <div className="bg-muted rounded-lg p-1 flex">
            <Button variant={theme === 'light' ? 'secondary' : 'ghost'} size="sm" className="flex-1 h-7" onClick={() => toggleTheme('light')}><Sun size={14}/></Button>
            <Button variant={theme === 'dark' ? 'secondary' : 'ghost'} size="sm" className="flex-1 h-7" onClick={() => toggleTheme('dark')}><Moon size={14}/></Button>
            <Button variant={theme === 'system' ? 'secondary' : 'ghost'} size="sm" className="flex-1 h-7" onClick={() => toggleTheme('system')}><Laptop size={14}/></Button>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-w-0">
        {/* Mobile Top Bar */}
        <div className="md:hidden flex items-center justify-between p-4 border-b bg-background/80 backdrop-blur-md sticky top-0 z-30">
          <Button variant="ghost" size="icon" onClick={() => setSidebarOpen(true)}>
            <Menu size={24} />
          </Button>
          <div className="flex items-center gap-2 font-serif font-bold text-lg">
            <Book size={18} className="text-primary" />
            <span>龙场书屋</span>
          </div>
          <div className="w-10" /> {/* Spacer for centering */}
        </div>
        
        <ScrollArea className="flex-1" viewportRef={mainScrollRef}>
          <div className="max-w-7xl mx-auto p-4 md:p-10 pb-32">
            <header className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 mb-12">
              <div className="flex-1">
                <h1 className="text-3xl md:text-5xl font-black font-serif mb-3 tracking-tighter">
                  {activeTab === 'All' ? '全部藏书' : activeTab}
                </h1>
                <p className="text-muted-foreground font-medium italic">读书不觉已春深，一寸光阴一寸金</p>
                
                <div className="mt-6 md:mt-8 flex flex-wrap gap-3 md:gap-4 items-center">
                  <div className="relative flex-1 min-w-0 max-w-sm">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground w-4 h-4" />
                    <Input 
                      placeholder="搜索书名或作者..." 
                      className="pl-10 h-10 bg-muted/50 border-none focus-visible:ring-1" 
                      value={searchQuery}
                      onChange={e => setSearchQuery(e.target.value)}
                    />
                  </div>
                  <select 
                    className="h-10 px-3 rounded-md bg-muted/50 border-none text-sm font-medium focus-visible:outline-none"
                    value={sortBy}
                    onChange={e => setSortBy(e.target.value)}
                  >
                    <option value="latest">最新入库</option>
                    <option value="rating">最高评分</option>
                    <option value="date">日期</option>
                  </select>
                </div>
              </div>
            </header>

            {filteredBooks.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-32 text-muted-foreground border-2 border-dashed rounded-3xl">
                <Book size={48} className="mb-4 opacity-20" />
                <p>暂无馆藏书籍</p>
                {searchQuery && <p className="text-xs uppercase mt-2">关键词: "{searchQuery}"</p>}
              </div>
            ) : (
              <div className="space-y-12">
                {groupedBooks.map(group => {
                  const annualList = annualLists.find(l => l.year === group.year);
                  return (
                  <div key={group.year} className="space-y-6">
                    <div className="flex items-center gap-4">
                      <h2 className="text-2xl font-serif font-bold text-primary/80">{group.year}</h2>
                      <div className="h-px flex-1 bg-muted" />
                      <Badge variant="ghost" className="text-muted-foreground font-mono">{group.items.length}</Badge>
                    </div>
                    {/* 年度书单 Banner */}
                    {annualList && (
                      <AnnualReadingListBanner
                        year={annualList.year}
                        count={annualList.count}
                        onClick={() => {
                          navigate(`/annual-list/${annualList.year}`); // Modified to use navigate
                        }}
                      />
                    )}
                    {/* 书籍网格 - 首页限制两行显示 */}
                    {(() => {
                      // 根据屏幕尺寸计算每行显示数量（与 grid 配置对应）
                      // grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5
                      const maxItems = activeTab === 'All' ? 10 : group.items.length; // 首页最多10本（两行5列）
                      const displayItems = group.items.slice(0, maxItems);
                      const hasMore = group.items.length > maxItems;

                      return (
                        <>
                          <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 md:gap-10">
                            {displayItems.map(book => (
                              <BookCard 
                                key={book.id} 
                                book={book} 
                                isBatchMode={isBatchMode}
                                isSelected={selectedBookIds.includes(book.id)}
                                onToggleSelect={toggleSelectBook}
                                onClick={(b) => navigate(`/book/${b.id}`)} 
                              />
                            ))}
                          </div>
                          {/* 查看全部按钮 */}
                          {hasMore && (
                            <div className="relative mt-4">
                              {/* 渐变遮罩 */}
                              <div className="absolute -top-16 left-0 right-0 h-16 bg-gradient-to-t from-background to-transparent pointer-events-none" />
                              <button
                                onClick={() => navigate(`/year/${group.year}`)}
                                className="w-full py-3 text-center text-sm font-medium text-muted-foreground hover:text-foreground transition-colors border border-dashed border-border/50 rounded-xl hover:border-border hover:bg-muted/20"
                              >
                                查看全部 {group.items.length} 本 →
                              </button>
                            </div>
                          )}
                        </>
                      );
                    })()}
                  </div>
                  );
                })}
              </div>
            )}
          </div>
          <ScrollToTop scrollRef={mainScrollRef} />
        </ScrollArea>
      </main>

      {/* Fullscreen Detail View */}
      <AnimatePresence>
        {selectedBook && (
          <BookFullscreenDetail 
            book={selectedBook}
            isAdmin={isAdmin}
            onOpenEditor={handleOpenEditorFromDetails}
            onClose={handleModalClose}
            selectedBookNotes={selectedBookNotes}
            handleDeleteNote={handleDeleteNote}
            isImportingNotes={isImportingNotes}
            setIsImportingNotes={setIsImportingNotes}
            importText={importText}
            setImportText={setImportText}
            handleImportNotes={handleImportNotes}
          />
        )}
      </AnimatePresence>

      {/* Annual Reading List Detail View */}
      <AnimatePresence>
        {selectedAnnualList && (
          <AnnualReadingListPage
            data={selectedAnnualList}
            onClose={() => {
              setSelectedAnnualList(null);
              handleModalClose();
            }}
          />
        )}
      </AnimatePresence>


    </div>
    </>
  );
}
