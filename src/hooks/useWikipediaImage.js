import { useState, useEffect } from "react";

// 🔥 全局缓存 - 在模块顶层，所有组件共享
const imageCache = new Map();

// 🚦 请求队列 - 限制并发请求数，避免Wikipedia API速率限制
const MAX_CONCURRENT = 3;
let activeRequests = 0;
const requestQueue = [];

function enqueueRequest(fn) {
  return new Promise((resolve, reject) => {
    const run = async () => {
      activeRequests++;
      try {
        resolve(await fn());
      } catch (e) {
        reject(e);
      } finally {
        activeRequests--;
        if (requestQueue.length > 0) {
          const next = requestQueue.shift();
          next();
        }
      }
    };

    if (activeRequests < MAX_CONCURRENT) {
      run();
    } else {
      requestQueue.push(run);
    }
  });
}

async function fetchWikipediaImage(pageName, retries = 2) {
  const imageApiUrl = `https://en.wikipedia.org/w/api.php?action=query&format=json&origin=*&titles=${encodeURIComponent(pageName)}&prop=pageimages&pithumbsize=500&redirects=1`;

  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      if (attempt > 0) {
        await new Promise(r => setTimeout(r, 1000 * attempt));
      }
      const response = await fetch(imageApiUrl);
      const data = await response.json();

      const pages = data.query?.pages;
      if (!pages) {
        imageCache.set(pageName, null);
        return null;
      }

      const pageId = Object.keys(pages)[0];
      const thumbnail = pages[pageId]?.thumbnail?.source || null;
      imageCache.set(pageName, thumbnail);
      return thumbnail;
    } catch (error) {
      if (attempt === retries) {
        console.error(`❌ 加载失败: ${pageName}`, error);
        imageCache.set(pageName, null);
        return null;
      }
    }
  }
}

export function useWikipediaImage(wikiPageName) {
  const [imageUrl, setImageUrl] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!wikiPageName) {
      setLoading(false);
      return;
    }

    // 检查缓存
    if (imageCache.has(wikiPageName)) {
      setImageUrl(imageCache.get(wikiPageName));
      setLoading(false);
      return;
    }

    let cancelled = false;

    enqueueRequest(() => fetchWikipediaImage(wikiPageName))
      .then((thumbnail) => {
        if (!cancelled) {
          setImageUrl(thumbnail);
          setLoading(false);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setLoading(false);
        }
      });

    return () => { cancelled = true; };
  }, [wikiPageName]);

  return { imageUrl, loading };
}

// 🚀 导出辅助函数：批量预加载
export async function preloadWikipediaImages(wikiPageNames, onProgress) {
  const total = wikiPageNames.length;

  console.log(`🚀 开始预加载 ${total} 个Wikipedia图片...`);

  // 分批处理，避免同时发送过多请求
  const BATCH_SIZE = 5;
  const counter = { loaded: 0 };

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
          counter.loaded++;
          if (onProgress) {
            onProgress({
              loaded: counter.loaded,
              total,
              progress: (counter.loaded / total) * 100
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

  for (const [, value] of imageCache.entries()) {
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