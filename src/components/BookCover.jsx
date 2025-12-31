import React from 'react';
import { Book } from 'lucide-react';
import { Badge } from './ui/badge';
import { normalizeCoverUrl } from '../utils/coverUrl';

/**
 * 通用书籍封面组件
 * 
 * @param {Object} props
 * @param {string} props.coverUrl - 封面图片URL
 * @param {string} props.title - 书籍标题（用于alt和占位符）
 * @param {string} props.status - 阅读状态：'已读', '在读', 或其他
 * @param {string} props.readingDate - 阅读日期
 * @param {boolean} props.showReadBadge - 是否显示已读badge（年度书单用）
 * @param {boolean} props.showUnreadBadge - 是否显示在读badge（首页用）
 * @param {string} props.className - 额外的CSS类名
 * @param {string} props.aspectRatio - 宽高比，默认 '3/4.2'
 * @param {string} props.primaryColor - 占位符主色调
 */
const BookCover = ({
  coverUrl,
  title,
  status,
  readingDate,
  showReadBadge = false,
  showUnreadBadge = true,
  className = '',
  aspectRatio = '3/4.2',
  primaryColor = '#8b5cf6',
}) => {
  const normalizedCoverUrl = normalizeCoverUrl(coverUrl);
  const placeholderUrl = 'https://via.placeholder.com/300x420?text=No+Cover';

  // 判断是否显示badge
  const isRead = status === '已读';
  const isReading = status === '在读';
  const is2025 = readingDate?.startsWith('2025');

  return (
    <div 
      className={`relative book-spine-shadow rounded-md overflow-hidden bg-muted ${className}`}
      style={{ aspectRatio }}
    >
      <img 
        src={normalizedCoverUrl || placeholderUrl} 
        alt={title} 
        className="w-full h-full object-cover transition-all group-hover:brightness-110"
        onError={(e) => { e.target.src = placeholderUrl; }}
      />
      
      {/* Badge区域 - 右上角 */}
      <div className="absolute top-2 right-2 flex gap-1">
        {/* 已读badge - 仅在 showReadBadge 为 true 时显示（年度书单） */}
        {showReadBadge && isRead && (
          <Badge className="bg-green-500/90 backdrop-blur-md border-none text-[10px] h-5 px-1.5 shadow-lg shadow-green-500/30">
            ✓ 已读
          </Badge>
        )}
        
        {/* 在读badge - 在 showUnreadBadge 为 true 且不是已读时显示（首页） */}
        {showUnreadBadge && isReading && (
          <Badge className="bg-amber-500/90 backdrop-blur-md border-none text-[10px] h-5 px-1.5">
            📖 在读
          </Badge>
        )}
        
        {/* 2025年份badge - 仅在未读且无在读状态时显示 */}
        {showUnreadBadge && is2025 && !isReading && !isRead && (
          <Badge className="bg-blue-500/80 backdrop-blur-md border-none text-[10px] h-5 px-1.5">
            2025
          </Badge>
        )}
      </div>
    </div>
  );
};

/**
 * 年度书单专用封面组件（带固定宽高比容器）
 */
export const AnnualBookCover = ({
  coverUrl,
  title,
  isRead = false,
  primaryColor = '#8b5cf6',
  className = '',
}) => {
  const normalizedCoverUrl = normalizeCoverUrl(coverUrl);

  return (
    <div className={`relative w-full ${className}`} style={{ paddingBottom: '133.33%' }}>
      <div className="absolute inset-0 rounded-xl overflow-hidden bg-muted shadow-lg group-hover:shadow-xl transition-shadow">
        {normalizedCoverUrl ? (
          <img
            src={normalizedCoverUrl}
            alt={title}
            className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform"
          />
        ) : (
          <div
            className="absolute inset-0 flex items-center justify-center"
            style={{ background: `linear-gradient(135deg, ${primaryColor}30, ${primaryColor}10)` }}
          >
            <Book className="w-8 h-8 sm:w-10 sm:h-10" style={{ color: primaryColor, opacity: 0.5 }} />
          </div>
        )}
        
        {/* 已读badge - 封面右上角 */}
        {isRead && (
          <div className="absolute top-1 right-1">
            <Badge className="bg-green-500/90 backdrop-blur-md border-none text-[9px] h-4 px-1 shadow-lg shadow-green-500/30">
              ✓ 已读
            </Badge>
          </div>
        )}
      </div>
    </div>
  );
};

export default BookCover;
