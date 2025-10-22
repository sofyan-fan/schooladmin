import { getChapters } from '@/apis/quranAPI';
import {
  ayahRangeForSurahIntersection,
  buildCumulative,
  hizbRange,
  intersects,
  keyToPair,
  surahRange,
  toGlobal,
} from '@/utils/quran-structure';
import { useEffect, useMemo, useState } from 'react';

// pak de eerst 60 hizb
async function fetchHizbStarts() {
  // try cache
  const cached =
    typeof window !== 'undefined' && localStorage.getItem('hizbStarts');
  if (cached) return JSON.parse(cached);

  const starts = [];
  for (let h = 1; h <= 60; h++) {
    const r = await fetch(
      `https://api.quran.com/api/v4/verses/by_hizb/${h}?fields=verse_key`
    );
    const j = await r.json();
    // first verse of payload is the hizb start
    const first = j?.verses?.[0]?.verse_key; // e.g. "2:1"
    if (!first) throw new Error('Failed to load hizb start ' + h);
    starts[h] = first;
  }
  if (typeof window !== 'undefined') {
    localStorage.setItem('hizbStarts', JSON.stringify(starts));
  }
  return starts;
}

export function useQuranRelations() {
  const [chapters, setChapters] = useState([]);
  const [versesCountBySurah, setV] = useState(null); // 1..114
  const [C, setC] = useState(null); // cumulative
  const [HG, setHG] = useState(null); // hizb starts in global index 1..60
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let on = true;
    (async () => {
      const cs = await getChapters();
      if (!on) return;
      setChapters(cs);

      // build V and cumulative
      const V = Array(115).fill(0);
      for (const c of cs) V[c.id] = c.verses_count;
      const csum = buildCumulative(V);
      setV(V);
      setC(csum);

      // hizb starts
      const starts = await fetchHizbStarts(); // 1..60 of "s:a"
      if (!on) return;
      const lastG = csum[114];

      const HGidx = Array(61).fill(0);
      for (let h = 1; h <= 60; h++) {
        const { s, a } = keyToPair(starts[h]);
        HGidx[h] = toGlobal(s, a, csum);
      }
      setHG({ idx: HGidx, lastG });
      setLoading(false);
    })();
    return () => {
      on = false;
    };
  }, []);

  const surahItems = useMemo(
    () =>
      chapters.map((c) => ({
        value: String(c.id),
        label: `${c.id}. ${c.name_simple}`,
      })),
    [chapters]
  );
  const hizbItemsAll = useMemo(
    () =>
      Array.from({ length: 60 }, (_, i) => ({
        value: String(i + 1),
        label: `Hizb ${i + 1}`,
      })),
    []
  );

  // filter functions
  function hizbsForSurah(surahId) {
    if (!C || !HG) return [];
    const [g1, g2] = surahRange(Number(surahId), C);
    const items = [];
    for (let h = 1; h <= 60; h++) {
      const hr = hizbRange(h, HG.idx, HG.lastG);
      if (intersects([g1, g2], hr))
        items.push({ value: String(h), label: `Hizb ${h}` });
    }
    return items;
  }

  function surahsForHizb(hizb) {
    if (!C || !HG) return [];
    const hr = hizbRange(Number(hizb), HG.idx, HG.lastG);
    return chapters
      .filter((c) => intersects(surahRange(c.id, C), hr))
      .map((c) => ({
        value: String(c.id),
        label: `${c.id}. ${c.name_simple}`,
      }));
  }

  // Ayah options given current surah and optional hizb filter
  function ayahsFor(surahId, maybeHizb) {
    if (!C || !versesCountBySurah || !surahId) return [];
    const s = Number(surahId);
    if (!maybeHizb) {
      return Array.from({ length: versesCountBySurah[s] }, (_, i) => ({
        value: String(i + 1),
        label: `Ayah ${i + 1}`,
      }));
    }
    const hr = hizbRange(Number(maybeHizb), HG.idx, HG.lastG);
    const ar = ayahRangeForSurahIntersection(s, hr, C);
    if (!ar) return []; // hizb does not touch this surah
    const [a1, a2] = ar;
    const items = [];
    for (let a = a1; a <= a2; a++)
      items.push({ value: String(a), label: `Ayah ${a}` });
    return items;
  }

  // Determine which hizb a given surah:ayah belongs to
  function hizbFor(surahId, ayah) {
    if (!C || !HG || !surahId || !ayah) return undefined;
    const s = Number(surahId);
    const a = Number(ayah);
    if (!s || !a) return undefined;
    const g = toGlobal(s, a, C);
    // find the last hizb start that is <= g
    let found = 1;
    for (let h = 1; h <= 60; h++) {
      if (HG.idx[h] && HG.idx[h] <= g) found = h;
    }
    return found;
  }

  return {
    loading,
    surahItems,
    hizbItemsAll,
    hizbsForSurah,
    surahsForHizb,
    ayahsFor,
    hizbFor,
  };
}
