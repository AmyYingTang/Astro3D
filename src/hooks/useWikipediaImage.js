import { useState, useEffect } from "react";

export function useWikipediaImage(wikiPageName) {
  const [imageUrl, setImageUrl] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchImage() {
      try {
        console.log(`Fetching image for Wikipedia page: ${wikiPageName}`);
        
        const imageApiUrl = `https://en.wikipedia.org/w/api.php?action=query&format=json&origin=*&titles=${encodeURIComponent(wikiPageName)}&prop=pageimages&pithumbsize=500&redirects=1`;
        
        const response = await fetch(imageApiUrl);
        const data = await response.json();
        
        const pages = data.query?.pages;
        if (!pages) {
          console.log(`No page found for: ${wikiPageName}`);
          setLoading(false);
          return;
        }

        const pageId = Object.keys(pages)[0];
        const thumbnail = pages[pageId]?.thumbnail?.source;

        if (thumbnail) {
          console.log(`✓ Image found for ${wikiPageName}: ${thumbnail}`);
          setImageUrl(thumbnail);
        } else {
          console.log(`✗ No thumbnail for ${wikiPageName}`);
        }
      } catch (error) {
        console.error(`Error fetching image for ${wikiPageName}:`, error);
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