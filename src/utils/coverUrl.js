/**
 * 统一的封面图片 URL 处理工具
 * 将各种格式的封面路径统一转换为正确的可访问路径
 */

/**
 * 规范化封面 URL
 * 支持以下格式：
 * - /uploads/xxx.jpg -> /uploads/xxx.jpg (保持不变)
 * - https://xxx (外链) -> 保持不变
 * - 空值 -> null
 * 
 * @param {string} coverUrl - 原始封面 URL
 * @returns {string|null} - 规范化后的 URL
 */
export const normalizeCoverUrl = (coverUrl) => {
  if (!coverUrl) return null;
  
  // 如果是外链，直接返回
  if (coverUrl.startsWith('http://') || coverUrl.startsWith('https://')) {
    return coverUrl;
  }
  
  // 本地路径保持不变
  return coverUrl;
};

/**
 * 获取封面图片的完整 URL（用于需要绝对路径的场景）
 * 
 * @param {string} coverUrl - 封面 URL
 * @param {string} baseUrl - 基础 URL（可选，默认为空）
 * @returns {string|null} - 完整的封面 URL
 */
export const getFullCoverUrl = (coverUrl, baseUrl = '') => {
  const normalized = normalizeCoverUrl(coverUrl);
  if (!normalized) return null;
  
  // 如果已经是绝对 URL，直接返回
  if (normalized.startsWith('http://') || normalized.startsWith('https://')) {
    return normalized;
  }
  
  return `${baseUrl}${normalized}`;
};

export default {
  normalizeCoverUrl,
  getFullCoverUrl
};
