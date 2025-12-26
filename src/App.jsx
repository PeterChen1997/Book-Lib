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
const BookCard = ({ book, onClick }) => {
  const coverPath = book.coverUrl?.startsWith('http') ? book.coverUrl : `${IMG_BASE}${book.coverUrl}`;
  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.98 }}
      className="group cursor-pointer flex flex-col gap-3"
      onClick={() => onClick(book)}
    >
      <div className="book-spine-shadow aspect-[3/4.2] rounded-md overflow-hidden bg-muted">
        <img 
          src={coverPath} 
          alt={book.title} 
          className="w-full h-full object-cover transition-all"
        />
        {book.readingYear === '2025' && (
          <Badge className="absolute top-2 left-2 bg-blue-500 hover:bg-blue-600 border-none">NEW</Badge>
        )}
      </div>
      <div>
        <h3 className="font-semibold text-sm line-clamp-1">{book.title}</h3>
        <p className="text-xs text-muted-foreground">{book.author}</p>
        <div className="mt-2 flex items-center gap-2">
          <div className="h-1 flex-1 bg-muted rounded-full overflow-hidden">
            <div 
              className="h-full bg-primary transition-all duration-500" 
              style={{ width: book.status === '已读' ? '100%' : '15%' }}
            />
          </div>
          <span className="text-[10px] text-muted-foreground font-medium">
            {book.status === '已读' ? '100' : '15'}%
          </span>
        </div>
      </div>
    </motion.div>
  );
};

// --- Book Editor Dialog ---
const BookEditor = ({ book, onSave, onCancel, onDelete, open, setOpen }) => {
  const [formData, setFormData] = useState(book || {
    title: '', author: '', readingYear: new Date().getFullYear().toString(),
    status: '想读', rating: 5, summary: '', review: '', quotes: [], fileUrl: ''
  });
  const [coverFile, setCoverFile] = useState(null);

  useEffect(() => {
    if (book) setFormData(book);
    else setFormData({
      title: '', author: '', readingYear: new Date().getFullYear().toString(),
      status: '想读', rating: 5, summary: '', review: '', quotes: [], fileUrl: ''
    });
  }, [book, open]);

  const handleSubmit = (e) => {
    e.preventDefault();
    const data = new FormData();
    Object.keys(formData).forEach(key => {
      if (key === 'quotes') data.append(key, JSON.stringify(formData[key]));
      else data.append(key, formData[key]);
    });
    if (coverFile) data.append('cover', coverFile);
    onSave(data, formData.id);
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
          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="year">年份</Label>
              <Input id="year" value={formData.readingYear} onChange={e => setFormData({...formData, readingYear: e.target.value})} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="status">阅读状态</Label>
              <select className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm" value={formData.status} onChange={e => setFormData({...formData, status: e.target.value})}>
                <option value="想读">想读</option>
                <option value="在读">在读</option>
                <option value="已读">已读</option>
              </select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="rating">评分 (1-5)</Label>
              <Input id="rating" type="number" min="1" max="5" value={formData.rating} onChange={e => setFormData({...formData, rating: parseInt(e.target.value)})} />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="summary">摘要 / 简介</Label>
            <Textarea id="summary" value={formData.summary} onChange={e => setFormData({...formData, summary: e.target.value})} className="h-20" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="review">我的书评</Label>
            <Textarea id="review" value={formData.review} onChange={e => setFormData({...formData, review: e.target.value})} className="h-32" />
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

export default function App() {
  const [books, setBooks] = useState([]);
  const [activeTab, setActiveTab] = useState('All');
  const [selectedBook, setSelectedBook] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [editorOpen, setEditorOpen] = useState(false);
  const [editingBook, setEditingBook] = useState(null);
  const { theme, toggleTheme } = useTheme();

  const fetchBooks = async () => {
    try {
      const res = await fetch(`${API_URL}/books`);
      const data = await res.json();
      setBooks(data);
    } catch (err) { console.error('Data sync failed', err); }
  };

  useEffect(() => { fetchBooks(); }, []);

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

  const filteredBooks = activeTab === 'All' ? books : books.filter(b => b.status === activeTab);

  return (
    <div className="flex h-screen bg-background text-foreground overflow-hidden font-sans select-none">
      {/* Sidebar */}
      <aside className="w-64 border-r bg-muted/30 flex flex-col p-4 backdrop-blur-xl">
        <div className="flex items-center gap-2 mb-8 px-2 font-serif font-bold text-xl tracking-tight italic">
          <Book className="text-primary" /> 墨香阁
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
            variant={activeTab === '想读' ? "secondary" : "ghost"} 
            className="w-full justify-start gap-3 h-10" 
            onClick={() => setActiveTab('想读')}
          >
            <Clock size={18} /> 想读
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
            <header className="flex justify-between items-end mb-12">
              <div>
                <h1 className="text-5xl font-black font-serif mb-3 tracking-tighter">
                  {activeTab === 'All' ? '全部藏书' : activeTab}
                </h1>
                <p className="text-muted-foreground font-medium italic">读书不觉已春深，一寸光阴一寸金</p>
              </div>
              {isAdmin && (
                <Button onClick={() => { setEditingBook(null); setEditorOpen(true); }} className="rounded-full shadow-lg">
                  <Plus className="w-4 h-4 mr-2" /> 录入书籍
                </Button>
              )}
            </header>

            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-10">
              {filteredBooks.map(book => (
                <BookCard key={book.id} book={book} onClick={setSelectedBook} />
              ))}
            </div>
          </div>
        </ScrollArea>
      </main>

      {/* Detail Panel */}
      <AnimatePresence>
        {selectedBook && (
          <motion.div 
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm p-4"
            onClick={() => setSelectedBook(null)}
          >
            <motion.div 
              initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }}
              className="w-full max-w-5xl bg-card border rounded-3xl shadow-2xl overflow-hidden flex flex-col md:flex-row max-h-[90vh]"
              onClick={e => e.stopPropagation()}
            >
              <div className="md:w-2/5 p-12 flex flex-col items-center bg-muted/20 border-r">
                <img 
                  src={selectedBook.coverUrl?.startsWith('http') ? selectedBook.coverUrl : `${IMG_BASE}${selectedBook.coverUrl}`} 
                  className="w-full max-w-[320px] book-spine-shadow rounded-sm"
                />
                <div className="mt-12 rating-seal scale-150">
                  {['零', '壹', '贰', '叁', '肆', '伍'][selectedBook.rating || 0]}
                </div>
              </div>
              
              <ScrollArea className="flex-1 p-12">
                <div className="flex justify-between items-start mb-10">
                  <div>
                    <h2 className="text-4xl font-black font-serif mb-3 tracking-tight">{selectedBook.title}</h2>
                    <p className="text-xl text-muted-foreground font-medium">{selectedBook.author}</p>
                  </div>
                  <div className="flex gap-2">
                    {isAdmin && (
                      <Button variant="outline" size="icon" onClick={() => { setEditingBook(selectedBook); setEditorOpen(true); setSelectedBook(null); }}>
                        <Edit3 className="w-4 h-4" />
                      </Button>
                    )}
                    <Button variant="ghost" size="icon" onClick={() => setSelectedBook(null)}>
                      <X className="w-5 h-5" />
                    </Button>
                  </div>
                </div>

                <div className="space-y-12">
                  <section>
                    <Label className="text-[10px] uppercase font-black tracking-widest text-blue-500 mb-4 block">About this book</Label>
                    <p className="text-base text-muted-foreground leading-relaxed">{selectedBook.summary}</p>
                  </section>
                  <Separator />
                  <section>
                    <Label className="text-[10px] uppercase font-black tracking-widest text-blue-500 mb-4 block">My Review</Label>
                    <div className="relative p-6 bg-muted/40 rounded-2xl italic text-lg leading-loose border-l-4 border-primary/20">
                      <Quote className="absolute -top-4 -left-4 w-10 h-10 text-primary/10 rotate-180" />
                      <p className="whitespace-pre-wrap">{selectedBook.review}</p>
                    </div>
                  </section>
                </div>
              </ScrollArea>
            </motion.div>
          </motion.div>
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
