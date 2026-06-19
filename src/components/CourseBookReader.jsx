import React, { useState, useEffect, useRef, useCallback } from 'react';
import { X, ChevronLeft, ChevronRight, GraduationCap, BookOpen, Menu } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import ReactMarkdown from 'react-markdown';
import { Button } from './ui/button';
import { ScrollArea } from './ui/scroll-area';
import { ScrollToTop } from './ui/scroll-to-top';
import { cn } from '../lib/utils';

const PROGRESS_KEY_PREFIX = 'course-progress:';

function loadProgress(slug) {
  try {
    const raw = localStorage.getItem(`${PROGRESS_KEY_PREFIX}${slug}`);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function saveProgress(slug, data) {
  try {
    localStorage.setItem(`${PROGRESS_KEY_PREFIX}${slug}`, JSON.stringify(data));
  } catch {
    // ignore
  }
}

export default function CourseBookReader({ book, onClose }) {
  const [chapterIndex, setChapterIndex] = useState(0);
  const [tocOpen, setTocOpen] = useState(false);
  const scrollViewportRef = useRef(null);
  const scrollSaveTimer = useRef(null);

  const chapters = book.chapters || [];
  const currentChapter = chapters[chapterIndex];

  // Restore progress on mount
  useEffect(() => {
    const saved = loadProgress(book.slug);
    if (saved && saved.chapterIndex < chapters.length) {
      setChapterIndex(saved.chapterIndex);
      // Restore scroll after the chapter content renders
      if (saved.scrollTop) {
        setTimeout(() => {
          scrollViewportRef.current?.scrollTo({ top: saved.scrollTop, behavior: 'instant' });
        }, 100);
      }
    }
  }, [book.slug, chapters.length]);

  const calcPercent = useCallback((chIdx, scrollTop) => {
    if (chapters.length === 0) return 0;
    const chapterProgress = chIdx / chapters.length;
    const viewport = scrollViewportRef.current;
    const chapterScrollRatio = viewport
      ? scrollTop / Math.max(1, viewport.scrollHeight - viewport.clientHeight)
      : 0;
    const withinChapter = chapterScrollRatio / chapters.length;
    return Math.min(100, Math.round((chapterProgress + withinChapter) * 100));
  }, [chapters.length]);

  const persistProgress = useCallback((chIdx, scrollTop) => {
    saveProgress(book.slug, {
      chapterIndex: chIdx,
      scrollTop,
      percent: calcPercent(chIdx, scrollTop),
      updatedAt: new Date().toISOString()
    });
  }, [book.slug, calcPercent]);

  // Save progress on scroll (throttled)
  const handleScroll = useCallback(() => {
    if (scrollSaveTimer.current) clearTimeout(scrollSaveTimer.current);
    scrollSaveTimer.current = setTimeout(() => {
      const scrollTop = scrollViewportRef.current?.scrollTop ?? 0;
      persistProgress(chapterIndex, scrollTop);
    }, 500);
  }, [chapterIndex, persistProgress]);

  const goToChapter = useCallback((idx) => {
    setChapterIndex(idx);
    setTocOpen(false);
    scrollViewportRef.current?.scrollTo({ top: 0, behavior: 'instant' });
    persistProgress(idx, 0);
  }, [persistProgress]);

  useEffect(() => {
    scrollViewportRef.current?.scrollTo({ top: 0, behavior: 'instant' });
    persistProgress(chapterIndex, 0);
  }, [chapterIndex, persistProgress]);

  const savedProgress = loadProgress(book.slug);
  const percent = savedProgress?.percent ?? 0;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 bg-background flex flex-col overflow-hidden"
    >
      {/* Top bar */}
      <div className="flex items-center justify-between px-4 md:px-6 py-3 border-b bg-background/95 backdrop-blur-md flex-shrink-0">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" className="rounded-full" onClick={onClose}>
            <X size={20} />
          </Button>
          <div className="flex items-center gap-2">
            <GraduationCap size={18} className="text-primary" />
            <span className="font-serif font-bold text-base md:text-lg truncate max-w-[200px] md:max-w-none">
              {book.title}
            </span>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-xs text-muted-foreground hidden md:block">
            {chapterIndex + 1} / {chapters.length} 章 · {percent}%
          </span>
          <Button
            variant="ghost"
            size="icon"
            className="rounded-full md:hidden"
            onClick={() => setTocOpen(true)}
          >
            <Menu size={20} />
          </Button>
        </div>
      </div>

      {/* Progress bar */}
      <div className="h-0.5 bg-muted flex-shrink-0">
        <div
          className="h-full bg-primary transition-all duration-300"
          style={{ width: `${percent}%` }}
        />
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* Mobile TOC overlay */}
        <AnimatePresence>
          {tocOpen && (
            <>
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 bg-black/50 z-40 md:hidden"
                onClick={() => setTocOpen(false)}
              />
              <motion.aside
                initial={{ x: -280 }}
                animate={{ x: 0 }}
                exit={{ x: -280 }}
                transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                className="fixed inset-y-0 left-0 w-72 bg-background border-r z-50 md:hidden flex flex-col"
              >
                <TocContent
                  chapters={chapters}
                  current={chapterIndex}
                  onSelect={goToChapter}
                  title={book.title}
                />
              </motion.aside>
            </>
          )}
        </AnimatePresence>

        {/* Desktop TOC sidebar */}
        <aside className="hidden md:flex w-64 border-r flex-col flex-shrink-0">
          <TocContent
            chapters={chapters}
            current={chapterIndex}
            onSelect={goToChapter}
            title={book.title}
          />
        </aside>

        {/* Main reading area */}
        <ScrollArea
          className="flex-1"
          viewportRef={scrollViewportRef}
          onScroll={handleScroll}
        >
          <div className="max-w-3xl mx-auto px-4 md:px-10 py-8 md:py-14 pb-32">
            {currentChapter ? (
              <>
                <h1 className="text-2xl md:text-4xl font-black font-serif mb-8 leading-tight">
                  <span className="text-primary/40 text-lg font-mono mr-3">
                    {String(chapterIndex + 1).padStart(2, '0')}
                  </span>
                  {currentChapter.title}
                </h1>
                <div className="prose prose-base md:prose-lg dark:prose-invert max-w-none prose-headings:font-serif prose-headings:font-bold prose-p:leading-relaxed prose-p:text-foreground/90">
                  <ReactMarkdown>{currentChapter.content}</ReactMarkdown>
                </div>
              </>
            ) : (
              <div className="flex items-center justify-center py-32 text-muted-foreground">
                <BookOpen size={32} className="mr-3 opacity-40" />
                <span>暂无内容</span>
              </div>
            )}
          </div>

          {/* Chapter navigation */}
          <div className="fixed bottom-6 right-6 flex flex-col gap-3 z-10">
            {chapterIndex > 0 && (
              <Button
                size="icon"
                className="w-12 h-12 rounded-full shadow-lg bg-primary/90 text-primary-foreground hover:bg-primary hover:scale-110 active:scale-95 transition-all"
                onClick={() => goToChapter(chapterIndex - 1)}
                title="上一章"
              >
                <ChevronLeft size={22} />
              </Button>
            )}
            {chapterIndex < chapters.length - 1 && (
              <Button
                size="icon"
                className="w-12 h-12 rounded-full shadow-lg bg-primary/90 text-primary-foreground hover:bg-primary hover:scale-110 active:scale-95 transition-all"
                onClick={() => goToChapter(chapterIndex + 1)}
                title="下一章"
              >
                <ChevronRight size={22} />
              </Button>
            )}
          </div>

          <ScrollToTop scrollRef={scrollViewportRef} />
        </ScrollArea>
      </div>
    </motion.div>
  );
}

function TocContent({ chapters, current, onSelect, title }) {
  return (
    <>
      <div className="px-4 py-4 border-b">
        <div className="flex items-center gap-2 text-sm font-bold text-muted-foreground uppercase tracking-widest">
          <BookOpen size={14} />
          <span>目录</span>
        </div>
        <p className="text-xs text-muted-foreground mt-1 truncate">{title}</p>
      </div>
      <ScrollArea className="flex-1">
        <nav className="p-2 space-y-0.5">
          {chapters.map((ch, idx) => (
            <button
              key={ch.id}
              onClick={() => onSelect(idx)}
              className={cn(
                "w-full text-left px-3 py-2.5 rounded-lg text-sm transition-colors flex items-start gap-2 group",
                idx === current
                  ? "bg-primary/10 text-primary font-semibold"
                  : "text-muted-foreground hover:bg-muted/50 hover:text-foreground"
              )}
            >
              <span className={cn(
                "font-mono text-xs mt-0.5 flex-shrink-0",
                idx === current ? "text-primary" : "text-muted-foreground/50 group-hover:text-muted-foreground"
              )}>
                {String(idx + 1).padStart(2, '0')}
              </span>
              <span className="leading-snug">{ch.title}</span>
            </button>
          ))}
        </nav>
      </ScrollArea>
    </>
  );
}
