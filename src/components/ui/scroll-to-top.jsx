import * as React from "react"
import { useState, useEffect } from "react"
import { ChevronUp } from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"
import { cn } from "../../lib/utils"

/**
 * 回到顶部按钮组件
 * 用于在页面滚动后显示一个固定在右下角的按钮，点击可以回到顶部
 * 
 * 使用方式：
 * 1. 将此组件放置在 ScrollArea 组件内部的任意位置
 * 2. 通过 scrollRef 传入 ScrollArea 的 viewport ref
 * 
 * @param {Object} props
 * @param {React.RefObject} props.scrollRef - ScrollArea viewport 的 ref
 * @param {number} props.threshold - 显示按钮的滚动阈值（默认 300px）
 * @param {string} props.className - 额外的样式类名
 */
const ScrollToTop = React.forwardRef(({ scrollRef, threshold = 300, className, ...props }, ref) => {
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    const scrollElement = scrollRef?.current
    if (!scrollElement) return

    const handleScroll = () => {
      setIsVisible(scrollElement.scrollTop > threshold)
    }

    scrollElement.addEventListener('scroll', handleScroll)
    // 初始检查
    handleScroll()

    return () => scrollElement.removeEventListener('scroll', handleScroll)
  }, [scrollRef, threshold])

  const scrollToTop = () => {
    const scrollElement = scrollRef?.current
    if (scrollElement) {
      scrollElement.scrollTo({
        top: 0,
        behavior: 'smooth'
      })
    }
  }

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.button
          ref={ref}
          initial={{ opacity: 0, scale: 0.8, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.8, y: 20 }}
          transition={{ duration: 0.2 }}
          onClick={scrollToTop}
          className={cn(
            "fixed bottom-20 right-4 md:bottom-8 md:right-8 z-50",
            "w-12 h-12 rounded-full",
            "bg-primary/90 text-primary-foreground",
            "shadow-lg shadow-primary/20",
            "backdrop-blur-md",
            "flex items-center justify-center",
            "hover:bg-primary hover:scale-110",
            "active:scale-95",
            "transition-all duration-200",
            "border border-primary-foreground/10",
            className
          )}
          {...props}
        >
          <ChevronUp size={24} />
        </motion.button>
      )}
    </AnimatePresence>
  )
})

ScrollToTop.displayName = "ScrollToTop"

export { ScrollToTop }
