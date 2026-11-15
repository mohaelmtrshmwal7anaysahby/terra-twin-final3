#!/usr/bin/env node
/**
 * Builds public/data/nasa-feed.json, a static snapshot of the NASA data the Express API serves live.
 * GitHub Pages has no backend, so the deploy workflow runs this before `vite build`.
 *
 * Honest by design: values come only from NASA responses; failed sources stay null/empty,
 * and the snapshot is labelled `nasa-snapshot` (never "live"). If every source fails, no file is written.
 */
import { mkdir, writeFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const OUT = resolve(dirname(fileURLToPath(import.meta.url)), '../public/data/nasa-feed.json');

async function getJson(url, ms = 8000) {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), ms);
  try {
    const res = await fetch(url, { signal: ctrl.signal, headers: { accept: 'application/json' } });
    if (!res.ok) throw new Error(`${res.status} ${res.statusText}`);
    return await res.json();
  } finally {
    clearTimeout(timer);
  }
}

const [rover, eonet] = await Promise.allSettled([
  getJson('https://mars.nasa.gov/rss/api/?feed=raw_images&category=mars2020&feedtype=json&num=1'),
  getJson('https://eonet.gsfc.nasa.gov/api/v3/events?limit=4&status=open'),
]);

const perseverance = {
  status: 'active',
  maxSol: null,
  maxDate: null,
  totalPhotos: null,
  source: 'baseline-cached',
};
if (rover.status === 'fulfilled') {
  const latest = rover.value.images?.[0];
  if (typeof latest?.sol === 'number' || typeof rover.value.total_results === 'number') {
    perseverance.maxSol = latest?.sol ?? null;
    perseverance.maxDate = latest?.date_taken_utc ? String(latest.date_taken_utc).slice(0, 10) : null;
    perseverance.totalPhotos = rover.value.total_results ?? null;
    perseverance.source = 'nasa-snapshot';
  }
} else {
  console.warn('Perseverance feed unavailable:', rover.reason?.message ?? rover.reason);
}

let earthEvents = [];
let eonetSource = 'unavailable';
if (eonet.status === 'fulfilled' && Array.isArray(eonet.value.events)) {
  earthEvents = eonet.value.events.slice(0, 4).map((ev) => ({
    id: ev.id,
    title: ev.title,
    category: ev.categories?.[0]?.title ?? 'Earth Observation',
    date: ev.geometry?.[0]?.date ?? '',
  }));
  eonetSource = 'nasa-snapshot-eonet';
} else if (eonet.status === 'rejected') {
  console.warn('EONET feed unavailable:', eonet.reason?.message ?? eonet.reason);
}

if (perseverance.source !== 'nasa-snapshot' && eonetSource === 'unavailable') {
  console.warn('No NASA source reachable; leaving the app on its built-in baseline (no snapshot written).');
  process.exit(0);
}

await mkdir(dirname(OUT), { recursive: true });
await writeFile(
  OUT,
  JSON.stringify({ fetchedAt: new Date().toISOString(), perseverance, earthEvents, eonetSource }, null, 2) + '\n'
);
console.log(`Wrote ${OUT}`);
