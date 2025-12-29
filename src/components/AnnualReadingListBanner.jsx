import React from 'react';
import { ChevronRight, Sparkles } from 'lucide-react';
import { motion } from 'framer-motion';

// 每年的主题色配置
const YEAR_THEMES = {
  '2025': {
    primary: '#9d6c5a',
    gradient: 'from-[#9d6c5a]/25 via-[#b08472]/15 to-[#c4a391]/20',
    darkGradient: 'dark:from-[#9d6c5a]/35 dark:via-[#b08472]/25 dark:to-[#c4a391]/30',
    iconBg: 'from-[#9d6c5a] to-[#b08472]',
    badge: 'bg-[#9d6c5a]/20 text-[#9d6c5a] dark:text-[#c4a391]',
    border: 'border-[#9d6c5a]/25 dark:border-[#9d6c5a]/30',
    shadow: 'shadow-[#9d6c5a]/30',
  },
  'default': {
    primary: '#f59e0b',
    gradient: 'from-amber-500/20 via-orange-500/15 to-red-500/20',
    darkGradient: 'dark:from-amber-600/30 dark:via-orange-600/25 dark:to-red-600/30',
    iconBg: 'from-amber-500 to-orange-600',
    badge: 'bg-amber-500/20 text-amber-600 dark:text-amber-400',
    border: 'border-amber-500/20 dark:border-amber-400/20',
    shadow: 'shadow-amber-500/30',
  }
};

/**
 * 年度书单 Banner 组件
 * 显示在年份分组下方，点击跳转到年度书单详情页
 */
const AnnualReadingListBanner = ({ year, count, onClick }) => {
  if (!count || count === 0) return null;

  const theme = YEAR_THEMES[year] || YEAR_THEMES['default'];

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.1 }}
      className={`group relative overflow-hidden cursor-pointer rounded-2xl mb-6`}
      onClick={onClick}
    >
      {/* Background Gradient */}
      <div className={`absolute inset-0 bg-gradient-to-r ${theme.gradient} ${theme.darkGradient}`} />
      <div className="absolute inset-0 bg-gradient-to-b from-transparent to-black/5 dark:to-black/20" />
      
      {/* Decorative Elements */}
      <div className={`absolute -right-8 -top-8 w-32 h-32 rounded-full bg-gradient-to-br ${theme.iconBg} opacity-20 blur-2xl`} />
      <div className={`absolute -left-4 -bottom-4 w-24 h-24 rounded-full bg-gradient-to-tr ${theme.iconBg} opacity-15 blur-xl`} />
      
      {/* Content */}
      <div className={`relative px-5 py-4 md:px-6 md:py-5 flex items-center justify-between gap-4 border ${theme.border} rounded-2xl backdrop-blur-sm`}>
        <div className="flex items-center gap-4">
          {/* Icon */}
          <div className={`w-12 h-12 md:w-14 md:h-14 rounded-xl bg-gradient-to-br ${theme.iconBg} flex items-center justify-center shadow-lg ${theme.shadow} group-hover:shadow-xl transition-shadow`}>
            <Sparkles className="w-6 h-6 md:w-7 md:h-7 text-white" />
          </div>
          
          {/* Text */}
          <div>
            <h3 className="font-bold text-base md:text-lg text-foreground flex items-center gap-2">
              <span>谦益读书会 {year} 年度书单</span>
              <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-bold ${theme.badge}`}>
                {count} 本
              </span>
            </h3>
            <p className="text-sm text-muted-foreground mt-0.5">
              群友们推荐的年度之书，点击查看详情
            </p>
          </div>
        </div>
        
        {/* Arrow */}
        <div className="flex-shrink-0 w-10 h-10 rounded-full bg-foreground/5 flex items-center justify-center group-hover:bg-foreground/10 transition-colors">
          <ChevronRight className="w-5 h-5 text-muted-foreground group-hover:text-foreground group-hover:translate-x-0.5 transition-all" />
        </div>
      </div>
    </motion.div>
  );
};

export default AnnualReadingListBanner;
