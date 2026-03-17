#!/usr/bin/env node
/**
 * Pre-fetch all Wikipedia thumbnail URLs for celestial objects.
 * Outputs: public/data/wiki_images.json
 *
 * Usage: node scripts/fetch-wiki-images.js
 */
const fs = require('fs');
const path = require('path');

const CSV_PATH = path.join(__dirname, '..', 'public', 'data', 'celestial_objects_full.csv');
const OUTPUT_PATH = path.join(__dirname, '..', 'public', 'data', 'wiki_images.json');
const BATCH_SIZE = 20;
const DELAY_MS = 3000;
const USER_AGENT = 'MyAstro3D/1.0 (https://astro3d.amytang.app; educational project)';

function parseCSV(text) {
  const lines = text.split('\n');
  const headers = lines[0].split(',');
  const wikiIdx = headers.indexOf('Wikipedia');

  const urls = [];
  for (let i = 1; i < lines.length; i++) {
    // Simple CSV parse - handle quoted fields
    const line = lines[i];
    if (!line.trim()) continue;

    const match = line.match(/https:\/\/en\.wikipedia\.org\/wiki\/([^\s,""]+)/);
    if (match) {
      urls.push(decodeURIComponent(match[1]));
    }
  }
  return [...new Set(urls)]; // dedupe
}

async function fetchBatch(titles) {
  const encoded = titles.map(t => encodeURIComponent(t)).join('|');
  const url = `https://en.wikipedia.org/w/api.php?action=query&format=json&origin=*&titles=${encoded}&prop=pageimages&pithumbsize=500&redirects=1`;

  const response = await fetch(url, {
    headers: { 'User-Agent': USER_AGENT, 'Api-User-Agent': USER_AGENT }
  });
  if (!response.ok) {
    throw new Error(`HTTP ${response.status}`);
  }
  const data = await response.json();

  // Build lookup maps
  const normalizedMap = {};
  for (const n of (data.query?.normalized || [])) {
    normalizedMap[n.from] = n.to;
  }
  const redirectMap = {};
  for (const r of (data.query?.redirects || [])) {
    redirectMap[r.from] = r.to;
  }

  const titleToThumb = {};
  const pages = data.query?.pages || {};
  for (const pageId of Object.keys(pages)) {
    const page = pages[pageId];
    if (page.thumbnail?.source) {
      titleToThumb[page.title] = page.thumbnail.source;
    }
  }

  // Resolve each title
  const results = {};
  for (const title of titles) {
    let resolved = normalizedMap[title] || title;
    resolved = redirectMap[resolved] || resolved;
    results[title] = titleToThumb[resolved] || null;
  }
  return results;
}

async function main() {
  console.log('Reading CSV...');
  const csv = fs.readFileSync(CSV_PATH, 'utf-8');
  const titles = parseCSV(csv);
  console.log(`Found ${titles.length} unique Wikipedia titles`);

  const allResults = {};
  let found = 0;

  for (let i = 0; i < titles.length; i += BATCH_SIZE) {
    const batch = titles.slice(i, i + BATCH_SIZE);
    console.log(`Fetching batch ${Math.floor(i/BATCH_SIZE) + 1}/${Math.ceil(titles.length/BATCH_SIZE)} (${batch.length} titles)...`);

    try {
      const results = await fetchBatch(batch);
      for (const [title, url] of Object.entries(results)) {
        allResults[title] = url;
        if (url) found++;
      }
    } catch (err) {
      console.error(`  Error: ${err.message}. Retrying in 5s...`);
      await new Promise(r => setTimeout(r, 5000));
      try {
        const results = await fetchBatch(batch);
        for (const [title, url] of Object.entries(results)) {
          allResults[title] = url;
          if (url) found++;
        }
      } catch (err2) {
        console.error(`  Retry failed: ${err2.message}. Skipping batch.`);
        for (const title of batch) {
          allResults[title] = null;
        }
      }
    }

    // Rate limit delay
    if (i + BATCH_SIZE < titles.length) {
      await new Promise(r => setTimeout(r, DELAY_MS));
    }
  }

  console.log(`\nResults: ${found}/${titles.length} thumbnails found`);

  // Only write non-null entries to keep file small
  const output = {};
  for (const [k, v] of Object.entries(allResults)) {
    if (v) output[k] = v;
  }

  fs.writeFileSync(OUTPUT_PATH, JSON.stringify(output, null, 2));
  console.log(`Written to ${OUTPUT_PATH} (${Object.keys(output).length} entries)`);
}

main().catch(console.error);
