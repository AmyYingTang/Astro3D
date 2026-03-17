import { useState, useEffect } from "react";

// Static pre-fetched image cache (loaded from wiki_images.json)
let staticCache = null;
let staticCachePromise = null;

function loadStaticCache() {
  if (staticCache) return Promise.resolve(staticCache);
  if (staticCachePromise) return staticCachePromise;

  staticCachePromise = fetch('/data/wiki_images.json')
    .then(r => r.json())
    .then(data => {
      staticCache = data;
      return data;
    })
    .catch(() => {
      staticCache = {};
      return {};
    });

  return staticCachePromise;
}

export function useWikipediaImage(wikiPageName) {
  const [imageUrl, setImageUrl] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!wikiPageName) {
      setLoading(false);
      return;
    }

    let cancelled = false;

    loadStaticCache().then((cache) => {
      if (cancelled) return;
      const url = cache[wikiPageName] || null;
      setImageUrl(url);
      setLoading(false);
    });

    return () => { cancelled = true; };
  }, [wikiPageName]);

  return { imageUrl, loading };
}
