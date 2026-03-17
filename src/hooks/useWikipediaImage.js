import { useState, useEffect } from "react";

// 全局缓存 - 在模块顶层，所有组件共享
const imageCache = new Map();

// 批量请求系统：收集短时间内的所有请求，合并为单次API调用
const BATCH_DELAY = 100; // 等待100ms收集请求
const BATCH_SIZE = 50;   // Wikipedia API每次最多50个title
let pendingRequests = new Map(); // pageName -> [resolve callbacks]
let batchTimer = null;

function scheduleBatch() {
  if (batchTimer) return;
  batchTimer = setTimeout(processBatch, BATCH_DELAY);
}

async function processBatch() {
  batchTimer = null;

  // 取出所有待处理请求
  const batch = new Map(pendingRequests);
  pendingRequests = new Map();

  const pageNames = [...batch.keys()];
  if (pageNames.length === 0) return;

  // 分批处理（每批最多50个，Wikipedia API限制）
  for (let i = 0; i < pageNames.length; i += BATCH_SIZE) {
    const chunk = pageNames.slice(i, i + BATCH_SIZE);
    await fetchBatch(chunk, batch);
  }
}

async function fetchBatch(pageNames, callbackMap, retries = 2) {
  const titles = pageNames.map(n => encodeURIComponent(n)).join('|');
  const url = `https://en.wikipedia.org/w/api.php?action=query&format=json&origin=*&titles=${titles}&prop=pageimages&pithumbsize=500&redirects=1`;

  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      if (attempt > 0) {
        await new Promise(r => setTimeout(r, 1000 * attempt));
      }
      const response = await fetch(url);
      const data = await response.json();

      // 构建 redirect 映射: 原始title -> 目标title
      const redirectMap = {};
      if (data.query?.redirects) {
        for (const r of data.query.redirects) {
          redirectMap[r.from] = r.to;
        }
      }
      // 构建 normalized 映射: 原始title -> 规范title
      const normalizedMap = {};
      if (data.query?.normalized) {
        for (const n of data.query.normalized) {
          normalizedMap[n.from] = n.to;
        }
      }

      // 构建 title -> thumbnail 映射
      const titleToThumb = {};
      const pages = data.query?.pages || {};
      for (const pageId of Object.keys(pages)) {
        const page = pages[pageId];
        titleToThumb[page.title] = page.thumbnail?.source || null;
      }

      // 为每个请求的pageName找到对应的thumbnail
      for (const pageName of pageNames) {
        // 跟踪 normalize -> redirect -> final title
        let resolvedTitle = normalizedMap[pageName] || pageName;
        resolvedTitle = redirectMap[resolvedTitle] || resolvedTitle;
        const thumbnail = titleToThumb[resolvedTitle] || null;

        imageCache.set(pageName, thumbnail);
        const callbacks = callbackMap.get(pageName) || [];
        for (const cb of callbacks) {
          cb(thumbnail);
        }
      }
      return; // 成功，退出重试循环
    } catch (error) {
      if (attempt === retries) {
        console.error(`❌ 批量加载失败:`, error);
        for (const pageName of pageNames) {
          imageCache.set(pageName, null);
          const callbacks = callbackMap.get(pageName) || [];
          for (const cb of callbacks) {
            cb(null);
          }
        }
      }
    }
  }
}

function requestImage(pageName) {
  return new Promise((resolve) => {
    if (!pendingRequests.has(pageName)) {
      pendingRequests.set(pageName, []);
    }
    pendingRequests.get(pageName).push(resolve);
    scheduleBatch();
  });
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

    requestImage(wikiPageName).then((thumbnail) => {
      if (!cancelled) {
        setImageUrl(thumbnail);
        setLoading(false);
      }
    });

    return () => { cancelled = true; };
  }, [wikiPageName]);

  return { imageUrl, loading };
}

// 导出辅助函数：批量预加载
export async function preloadWikipediaImages(wikiPageNames, onProgress) {
  const total = wikiPageNames.length;
  const counter = { loaded: 0 };

  for (let i = 0; i < wikiPageNames.length; i += BATCH_SIZE) {
    const chunk = wikiPageNames.slice(i, i + BATCH_SIZE);
    const uncached = chunk.filter(n => !imageCache.has(n));

    if (uncached.length > 0) {
      const callbackMap = new Map();
      for (const name of uncached) {
        callbackMap.set(name, []);
      }
      await fetchBatch(uncached, callbackMap);
    }

    counter.loaded += chunk.length;
    if (onProgress) {
      onProgress({
        loaded: counter.loaded,
        total,
        progress: (counter.loaded / total) * 100
      });
    }
  }

  return imageCache;
}

// 导出辅助函数：查看缓存状态
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

  return stats;
}

// 导出辅助函数：清空缓存（用于调试）
export function clearImageCache() {
  imageCache.clear();
}
