import { useState, useEffect } from "react";

// 🔥 全局缓存 - 在模块顶层，所有组件共享
const imageCache = new Map();

export function useWikipediaImage(wikiPageName) {
  const [imageUrl, setImageUrl] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchImage() {
      try {
        // 📦 步骤1: 检查缓存
        if (imageCache.has(wikiPageName)) {
          console.log(`📦 从缓存读取: ${wikiPageName}`);
          setImageUrl(imageCache.get(wikiPageName));
          setLoading(false);
          return; // 直接返回，不调用API
        }

        // 🌐 步骤2: 缓存未命中，调用API
        console.log(`🌐 API调用: ${wikiPageName}`);
        
        const imageApiUrl = `https://en.wikipedia.org/w/api.php?action=query&format=json&origin=*&titles=${encodeURIComponent(wikiPageName)}&prop=pageimages&pithumbsize=500&redirects=1`;
        
        const response = await fetch(imageApiUrl);
        const data = await response.json();
        
        const pages = data.query?.pages;
        if (!pages) {
          console.log(`❌ 页面未找到: ${wikiPageName}`);
          // 缓存null结果，避免重复请求不存在的页面
          imageCache.set(wikiPageName, null);
          setLoading(false);
          return;
        }

        const pageId = Object.keys(pages)[0];
        const thumbnail = pages[pageId]?.thumbnail?.source;

        // 💾 步骤3: 存入缓存（无论成功或失败）
        imageCache.set(wikiPageName, thumbnail || null);

        if (thumbnail) {
          console.log(`✅ 图片已加载并缓存: ${wikiPageName}`);
          setImageUrl(thumbnail);
        } else {
          console.log(`⚠️ 无缩略图: ${wikiPageName}`);
        }
      } catch (error) {
        console.error(`❌ 加载失败: ${wikiPageName}`, error);
        // 缓存错误结果，避免重复尝试失败的请求
        imageCache.set(wikiPageName, null);
      } finally {
        setLoading(false);
      }
    }

    if (wikiPageName) {
      fetchImage();
    } else {
      setLoading(false);
    }
  }, [wikiPageName]);

  return { imageUrl, loading };
}

// 🚀 导出辅助函数：批量预加载
export async function preloadWikipediaImages(wikiPageNames, onProgress) {
  const total = wikiPageNames.length;
  let loaded = 0;

  console.log(`🚀 开始预加载 ${total} 个Wikipedia图片...`);

  // 分批处理，避免同时发送过多请求
  const BATCH_SIZE = 5;
  
  for (let i = 0; i < wikiPageNames.length; i += BATCH_SIZE) {
    const batch = wikiPageNames.slice(i, i + BATCH_SIZE);
    
    // 并发请求当前批次
    await Promise.allSettled(
      batch.map(async (pageName) => {
        // 跳过已缓存的
        if (imageCache.has(pageName)) {
          console.log(`⏭️ 已缓存，跳过: ${pageName}`);
          return;
        }

        try {
          const imageApiUrl = `https://en.wikipedia.org/w/api.php?action=query&format=json&origin=*&titles=${encodeURIComponent(pageName)}&prop=pageimages&pithumbsize=500&redirects=1`;
          
          const response = await fetch(imageApiUrl);
          const data = await response.json();
          
          const pages = data.query?.pages;
          const pageId = Object.keys(pages)[0];
          const thumbnail = pages[pageId]?.thumbnail?.source;

          imageCache.set(pageName, thumbnail || null);
          
          if (thumbnail) {
            console.log(`✅ 预加载成功: ${pageName}`);
          } else {
            console.log(`⚠️ 无图片: ${pageName}`);
          }
        } catch (error) {
          console.error(`❌ 预加载失败: ${pageName}`, error);
          imageCache.set(pageName, null);
        } finally {
          loaded++;
          if (onProgress) {
            onProgress({
              loaded,
              total,
              progress: (loaded / total) * 100
            });
          }
        }
      })
    );
  }

  console.log(`🎉 预加载完成！共缓存 ${imageCache.size} 个图片`);
  return imageCache;
}

// 🔍 导出辅助函数：查看缓存状态
export function getCacheStats() {
  const stats = {
    totalCached: imageCache.size,
    withImages: 0,
    withoutImages: 0
  };

  for (const [key, value] of imageCache.entries()) {
    if (value) {
      stats.withImages++;
    } else {
      stats.withoutImages++;
    }
  }

  console.log('📊 缓存状态:', stats);
  return stats;
}

// 🗑️ 导出辅助函数：清空缓存（用于调试）
export function clearImageCache() {
  imageCache.clear();
  console.log('🗑️ 缓存已清空');
}