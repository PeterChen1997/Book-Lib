import React, { useState, useEffect } from 'react';
import { 
  Home, Library, Clock, CheckCircle2, Book, Music, FileText, 
  Search, Plus, MoreHorizontal, ChevronRight, X, Edit3, Save, Trash2, Upload, User,
  Moon, Sun, Laptop, Star
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

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

const API_URL = 'http://localhost:3001/api';
const IMG_BASE = 'http://localhost:3001';

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

// --- Book Card Component ---
const BookCard = ({ book, onClick, isBatchMode, isSelected, onToggleSelect }) => {
  const coverPath = book.coverUrl?.startsWith('http') ? book.coverUrl : `${IMG_BASE}${book.coverUrl}`;
  const progressPercent = book.status === '已读' ? 100 : (book.readingProgress || 0);

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
          {book.readingDate?.startsWith('2025') && (
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
        <div className="flex items-center gap-1 mt-1 text-yellow-500">
          {[...Array(5)].map((_, i) => (
            <Star key={i} size={10} fill={i < (book.rating || 0) ? "currentColor" : "none"} />
          ))}
        </div>
        <div className="mt-3 flex items-center gap-2">
          <div className="h-1 flex-1 bg-muted rounded-full overflow-hidden">
            <div 
              className="h-full bg-primary transition-all duration-700 ease-out" 
              style={{ width: `${progressPercent}%` }}
            />
          </div>
          <span className="text-[10px] text-muted-foreground font-mono font-bold">
            {progressPercent}%
          </span>
        </div>
      </div>
    </motion.div>
  );
};

// --- Book Editor Dialog ---
const BookEditor = ({ book, onSave, onCancel, onDelete, open, setOpen }) => {
  const [formData, setFormData] = useState(book || {
    title: '', author: '', readingDate: new Date().toISOString().split('T')[0],
    status: '已读', rating: 5, summary: '', review: '', quotes: [], fileUrl: '',
    readingProgress: 0, totalPages: 0
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
        readingProgress: 0, totalPages: 0
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
              <Label htmlFor="rating">评分 (1-5)</Label>
              <Input id="rating" type="number" min="1" max="5" value={formData.rating} onChange={e => setFormData({...formData, rating: parseInt(e.target.value)})} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="progress">进度 (%)</Label>
              <Input id="progress" type="number" min="0" max="100" value={formData.readingProgress} onChange={e => setFormData({...formData, readingProgress: parseInt(e.target.value)})} />
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
  onUpdateProgress, 
  onOpenEditor, 
  onClose,
  selectedBookNotes,
  handleDeleteNote,
  isImportingNotes, setIsImportingNotes, importText, setImportText, handleImportNotes
}) => {
  if (!book) return null;
  
  const coverPath = book.coverUrl?.startsWith('http') ? book.coverUrl : `${IMG_BASE}${book.coverUrl}`;
  const progressPercent = book.status === '已读' ? 100 : (book.readingProgress || 0);

  return (
    <motion.div 
      initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}
      className="fixed inset-0 z-50 bg-background flex flex-col overflow-hidden"
    >
      {/* Scrollable Container */}
      <ScrollArea className="flex-1">
        {/* Hero Section */}
        <div className="relative h-[60vh] min-h-[500px] w-full overflow-hidden">
          <div 
            className="absolute inset-0 bg-cover bg-center scale-110 blur-3xl opacity-20"
            style={{ backgroundImage: `url(${coverPath})` }}
          />
          <div className="absolute inset-0 bg-gradient-to-b from-transparent via-background/50 to-background" />
          
          <div className="relative h-full max-w-7xl mx-auto px-10 flex flex-col md:flex-row items-end pb-12 gap-12">
            <motion.div 
              initial={{ y: 40, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.2 }}
              className="w-64 flex-shrink-0"
            >
              <img 
                src={coverPath} 
                className="w-full book-spine-shadow rounded-lg shadow-2xl" 
                alt={book.title}
                onError={(e) => { e.target.src = 'https://via.placeholder.com/300x420?text=No+Cover'; }}
              />
            </motion.div>
            
            <div className="flex-1 space-y-6 mb-4">
              <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.3 }}>
                <div className="flex items-center gap-3 mb-4">
                  <Badge variant="secondary" className="bg-primary/10 text-primary border-none text-xs px-3 py-1">
                    {book.status}
                  </Badge>
                  <span className="text-muted-foreground text-sm font-medium">{book.readingDate}</span>
                </div>
                <h1 className="text-6xl font-black font-serif tracking-tighter mb-4 leading-none">
                  {book.title}
                </h1>
                <p className="text-2xl text-muted-foreground font-medium italic">
                  — {book.author}
                </p>
              </motion.div>
              
              <div className="flex items-center gap-6 pt-4">
                <div className="flex items-center gap-1 text-yellow-500">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} size={20} fill={i < (book.rating || 0) ? "currentColor" : "none"} />
                  ))}
                </div>
                <div className="h-8 w-px bg-border" />
                <div className="flex items-center gap-3">
                  <div className="text-sm font-black uppercase tracking-widest text-muted-foreground">Progress</div>
                  <div className="text-2xl font-mono font-bold">{progressPercent}%</div>
                </div>
              </div>
            </div>
          </div>

          {/* Floating Action Bar */}
          <div className="absolute top-10 right-10 left-10 flex justify-between items-center z-10">
            <Button variant="ghost" size="icon" className="rounded-full bg-background/20 backdrop-blur-md hover:bg-background/40" onClick={onClose}>
              <X size={24} />
            </Button>
            <div className="flex gap-3">
              {book.fileUrl && (
                <Button variant="secondary" className="rounded-full bg-background/20 backdrop-blur-md" onClick={() => window.open(book.fileUrl)}>
                  <FileText className="w-4 h-4 mr-2" /> 阅读原文
                </Button>
              )}
              {isAdmin && (
                <Button variant="secondary" className="rounded-full bg-background/20 backdrop-blur-md" onClick={() => onOpenEditor(book)}>
                  <Edit3 className="w-4 h-4 mr-2" /> 编辑
                </Button>
              )}
            </div>
          </div>
        </div>

        {/* Content Section */}
        <div className="max-w-7xl mx-auto px-10 py-20 pb-40">
          <Tabs defaultValue="notes" className="w-full">
            <TabsList className="w-fit mb-16 bg-muted/30 p-1 rounded-full h-14 border border-border/50">
              <TabsTrigger value="overview" className="rounded-full px-8 h-full data-[state=active]:bg-background data-[state=active]:shadow-lg text-base">概要与点评</TabsTrigger>
              <TabsTrigger value="notes" className="rounded-full px-8 h-full data-[state=active]:bg-background data-[state=active]:shadow-lg text-base">读书笔记 ({selectedBookNotes.length})</TabsTrigger>
              <TabsTrigger value="quotes" className="rounded-full px-8 h-full data-[state=active]:bg-background data-[state=active]:shadow-lg text-base">经典金句 ({book.quotes?.length || 0})</TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="outline-none space-y-24">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-16">
                <div className="md:col-span-2 space-y-12">
                  <section>
                    <Label className="text-xs uppercase font-black tracking-[0.2em] text-primary mb-6 block">Content Summary</Label>
                    <div className="relative">
                      <div className="absolute -left-6 top-0 bottom-0 w-1 bg-primary/20 rounded-full" />
                      <p className="text-xl leading-relaxed text-muted-foreground font-serif pl-0">
                        {book.summary || "尚未添加书籍摘要。"}
                      </p>
                    </div>
                  </section>
                  <section>
                    <Label className="text-xs uppercase font-black tracking-[0.2em] text-primary mb-6 block">Personal Review</Label>
                    <div className="relative p-12 bg-muted/20 rounded-[3rem] border border-border/50 italic shadow-inner shadow-black/5">
                      <Quote className="absolute -top-6 -left-6 w-16 h-16 text-primary/10 rotate-180" />
                      <span className="absolute top-8 right-12 text-6xl font-serif text-primary/5 select-none">评</span>
                      <p className="text-2xl leading-loose whitespace-pre-wrap font-serif relative z-10">
                        {book.review || "暂未撰写书评。"}
                      </p>
                    </div>
                  </section>
                </div>
                
                <div className="space-y-12">
                   <section className="bg-primary/5 p-8 rounded-[2rem] border border-primary/10">
                      <Label className="text-xs uppercase font-black tracking-[0.1em] text-primary/60 mb-6 block italic">Reading Stats</Label>
                      <div className="space-y-6">
                        <div>
                          <div className="text-3xl font-mono font-bold mb-2">{progressPercent}%</div>
                          <div className="h-1.5 w-full bg-background rounded-full overflow-hidden">
                            <div className="h-full bg-primary" style={{ width: `${progressPercent}%` }} />
                          </div>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                           <div className="p-3 bg-background rounded-2xl border border-border/50">
                             <div className="text-[10px] uppercase font-bold text-muted-foreground mb-1">Status</div>
                             <div className="text-sm font-bold">{book.status}</div>
                           </div>
                           <div className="p-3 bg-background rounded-2xl border border-border/50">
                             <div className="text-[10px] uppercase font-bold text-muted-foreground mb-1">Rating</div>
                             <div className="text-sm font-bold">{book.rating} / 5</div>
                           </div>
                        </div>
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
                 {isAdmin && (
                    <Dialog open={isImportingNotes} onOpenChange={setIsImportingNotes}>
                      <DialogTrigger asChild>
                        <Button className="rounded-full px-6 h-11">
                          <Plus className="w-4 h-4 mr-2" /> 新增笔记
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="max-w-2xl">
                        <DialogHeader>
                          <DialogTitle>批量导入 / 记录笔记</DialogTitle>
                        </DialogHeader>
                        <div className="py-6 space-y-4">
                          <Textarea 
                            placeholder="粘贴您的笔记内容，每行将被识别为一条独立的笔记..." 
                            value={importText} 
                            onChange={(e) => setImportText(e.target.value)} 
                            className="min-h-[300px] rounded-2xl p-6 text-base leading-relaxed"
                          />
                        </div>
                        <DialogFooter>
                          <Button variant="ghost" onClick={() => setIsImportingNotes(false)}>放弃</Button>
                          <Button onClick={handleImportNotes} className="rounded-full px-8">保存笔记</Button>
                        </DialogFooter>
                      </DialogContent>
                    </Dialog>
                 )}
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
                      <div className="absolute bottom-6 left-8 right-8 flex justify-between items-center">
                        <span className="text-[10px] font-mono font-bold tracking-widest text-muted-foreground uppercase">
                          {new Date(note.created_at).toLocaleDateString()}
                        </span>
                        {isAdmin && (
                          <Button 
                            variant="ghost" size="icon" 
                            className="h-8 w-8 rounded-full opacity-0 group-hover:opacity-100 transition-opacity hover:bg-destructive/10 hover:text-destructive"
                            onClick={() => handleDeleteNote(note.id)}
                          >
                            <Trash2 size={14} />
                          </Button>
                        )}
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </TabsContent>

            <TabsContent value="quotes" className="outline-none">
               <div className="columns-1 md:columns-2 lg:columns-3 gap-8 space-y-8">
                 {book.quotes?.map((quote, idx) => (
                   <div key={quote.id || idx} className="break-inside-avoid p-10 bg-primary/5 rounded-[2.5rem] border border-primary/10 relative overflow-hidden group">
                     <span className="absolute -top-4 -right-4 text-8xl font-serif text-primary/10 select-none">”</span>
                     <p className="text-xl italic font-serif leading-loose relative z-10 text-foreground/90">
                       “{quote.content}”
                     </p>
                   </div>
                 ))}
                 {(!book.quotes || book.quotes.length === 0) && (
                   <p className="text-center text-muted-foreground py-20 col-span-full font-serif italic text-lg opacity-40">此书尚未收录金句。</p>
                 )}
               </div>
            </TabsContent>
          </Tabs>
        </div>
      </ScrollArea>
    </motion.div>
  );
};


export default function App() {
  const [books, setBooks] = useState([]);
  const [activeTab, setActiveTab] = useState('All');
  const [selectedBook, setSelectedBook] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [editorOpen, setEditorOpen] = useState(false);
  const [editingBook, setEditingBook] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState('latest');
  const { theme, toggleTheme } = useTheme();

  const [isBatchMode, setIsBatchMode] = useState(false);
  const [selectedBookIds, setSelectedBookIds] = useState([]);
  const [selectedBookNotes, setSelectedBookNotes] = useState([]);
  const [isImportingNotes, setIsImportingNotes] = useState(false);
  const [importText, setImportText] = useState('');

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

  useEffect(() => {
    if (selectedBook) {
      fetchNotes(selectedBook.id);
    } else {
      setSelectedBookNotes([]);
    }
  }, [selectedBook]);

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

  const handleUpdateProgress = async (book, newProgress) => {
    const formData = new FormData();
    Object.keys(book).forEach(key => {
      if (key === 'quotes') formData.append(key, JSON.stringify(book[key]));
      else if (key === 'readingProgress') formData.append(key, newProgress);
      else formData.append(key, book[key]);
    });
    await fetch(`${API_URL}/books/${book.id}`, { method: 'PUT', body: formData });
    fetchBooks();
    if (selectedBook && selectedBook.id === book.id) {
      setSelectedBook({ ...selectedBook, readingProgress: newProgress });
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
    setSelectedBook(null); // Close details panel when opening editor
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

  const filteredBooks = activeTab === 'All' ? books : books.filter(b => b.status === activeTab);
  const groupedBooks = groupBooksByYear(filteredBooks);

  return (
    <div className="flex h-screen bg-background text-foreground overflow-hidden font-sans select-none">
      {/* Sidebar */}
      <aside className={cn(
        "w-72 border-r bg-muted/20 flex flex-col p-6 backdrop-blur-3xl transition-transform duration-500",
        selectedBook ? "-translate-x-full absolute" : "relative translate-x-0"
      )}>
        <div className="flex items-center gap-3 mb-10 px-2 font-serif font-bold text-2xl tracking-tighter italic">
          <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center text-primary-foreground shadow-lg shadow-primary/20">
            <Book size={20} />
          </div>
          <span>藏书阁</span>
        </div>

        <nav className="flex-1 space-y-1">
          <p className="px-2 text-[10px] font-black text-muted-foreground uppercase tracking-widest mb-2">My Library</p>
          <Button 
            variant={activeTab === 'All' ? "secondary" : "ghost"} 
            className="w-full justify-start gap-3 h-10" 
            onClick={() => setActiveTab('All')}
          >
            <Library size={18} /> 全部书籍
          </Button>
          <Button 
            variant={activeTab === '已读' ? "secondary" : "ghost"} 
            className="w-full justify-start gap-3 h-10" 
            onClick={() => setActiveTab('已读')}
          >
            <CheckCircle2 size={18} /> 已读
          </Button>
        </nav>

        <div className="mt-auto pt-4 border-t space-y-4">
          <div className="flex items-center justify-between px-2">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-primary-foreground">
                <User size={16} />
              </div>
              <span className="text-sm font-semibold tracking-tight">PETER</span>
            </div>
            <Button variant="ghost" size="icon" onClick={() => setIsAdmin(!isAdmin)}>
              <Edit3 size={16} className={isAdmin ? 'text-blue-500' : ''} />
            </Button>
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
        <ScrollArea className="flex-1">
          <div className="max-w-7xl mx-auto p-10 pb-32">
            <header className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 mb-12">
              <div className="flex-1">
                <h1 className="text-5xl font-black font-serif mb-3 tracking-tighter">
                  {activeTab === 'All' ? '全部藏书' : activeTab}
                </h1>
                <p className="text-muted-foreground font-medium italic">读书不觉已春深，一寸光阴一寸金</p>
                
                <div className="mt-8 flex flex-wrap gap-4 items-center">
                  <div className="relative w-full max-w-sm">
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
                  
                  {isAdmin && (
                    <div className="flex gap-2 ml-auto">
                      {isBatchMode ? (
                        <>
                          <Button variant="destructive" size="sm" onClick={handleBatchDelete} disabled={selectedBookIds.length === 0}>
                            <Trash2 size={14} className="mr-2" /> 删除({selectedBookIds.length})
                          </Button>
                          <Button variant="outline" size="sm" onClick={() => { setIsBatchMode(false); setSelectedBookIds([]); }}>
                             取消
                          </Button>
                        </>
                      ) : (
                        <Button variant="outline" size="sm" onClick={() => setIsBatchMode(true)}>
                          <CheckCircle2 size={14} className="mr-2" /> 批量管理
                        </Button>
                      )}
                    </div>
                  )}
                </div>
              </div>
              {isAdmin && !isBatchMode && (
                <Button onClick={() => { setEditingBook(null); setEditorOpen(true); }} className="rounded-full shadow-lg h-12 px-6">
                  <Plus className="w-5 h-5 mr-2" /> 录入新书
                </Button>
              )}
            </header>

            {filteredBooks.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-32 text-muted-foreground border-2 border-dashed rounded-3xl">
                <Book size={48} className="mb-4 opacity-20" />
                <p>暂无馆藏书籍</p>
                {searchQuery && <p className="text-xs uppercase mt-2">关键词: "{searchQuery}"</p>}
              </div>
            ) : (
              <div className="space-y-12">
                {groupedBooks.map(group => (
                  <div key={group.year} className="space-y-6">
                    <div className="flex items-center gap-4">
                      <h2 className="text-2xl font-serif font-bold text-primary/80">{group.year}</h2>
                      <div className="h-px flex-1 bg-muted" />
                      <Badge variant="ghost" className="text-muted-foreground font-mono">{group.items.length}</Badge>
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-10">
                      {group.items.map(book => (
                        <BookCard 
                          key={book.id} 
                          book={book} 
                          onClick={setSelectedBook} 
                          isBatchMode={isBatchMode}
                          isSelected={selectedBookIds.includes(book.id)}
                          onToggleSelect={toggleSelectBook}
                        />
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </ScrollArea>
      </main>

      {/* Fullscreen Detail View */}
      <AnimatePresence>
        {selectedBook && (
          <BookFullscreenDetail 
            book={selectedBook}
            isAdmin={isAdmin}
            onUpdateProgress={handleUpdateProgress}
            onOpenEditor={handleOpenEditorFromDetails}
            onClose={() => setSelectedBook(null)}
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

      <BookEditor 
        open={editorOpen} 
        setOpen={setEditorOpen}
        book={editingBook}
        onSave={handleSave}
        onDelete={handleDelete}
      />
    </div>
  );
}

const Quote = ({ className }) => (
  <svg className={className} width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
    <path d="M14.017 21L14.017 18C14.017 16.8954 14.9124 16 16.017 16H19.017C19.5693 16 20.017 15.5523 20.017 15V9C20.017 8.44772 19.5693 8 19.017 8H16.017C14.9124 8 14.017 7.10457 14.017 6V4H19.017C20.1216 4 21.017 4.89543 21.017 6V15C21.017 17.2091 19.2261 19 17.017 19H14.017V21H14.017ZM3.01697 21L3.01697 18C3.01697 16.8954 3.9124 16 5.01697 16H8.01697C8.56925 16 9.01697 15.5523 9.01697 15V9C9.01697 8.44772 8.56925 8 8.01697 8H5.01697C3.9124 8 3.01697 7.10457 3.01697 6V4H8.01697C9.12154 4 10.017 4.89543 10.017 6V15C10.017 17.2091 8.22611 19 6.01697 19H3.01697V21H3.01697Z" />
  </svg>
);
