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
      // Always show surahs in canonical order: 1..114
      chapters
        .slice()
        .sort((a, b) => a.id - b.id)
        .map((c) => ({
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

  // Compute a global starting index for a partial point
  // Supports: { surahId, ayah, hizb }
  function globalStartForPoint(p) {
    if (!C || !HG) return 1;
    const surahId = Number(p?.surahId || 0);
    const ayah = Number(p?.ayah || 0);
    const hizb = Number(p?.hizb || 0);
    if (surahId && ayah) return toGlobal(surahId, ayah, C);
    if (hizb) return HG.idx[hizb] || 1;
    if (surahId) return surahRange(surahId, C)[0];
    return 1;
  }

  // Compute a global limiting index for reversed (descending) selection semantics.
  // If only a surah is chosen, use the END of the surah as the bound so the user
  // can still choose any ayah within that surah or any earlier surah.
  function globalEndForPoint(p) {
    if (!C || !HG) return C ? C[114] : 6236;
    const surahId = Number(p?.surahId || 0);
    const ayah = Number(p?.ayah || 0);
    const hizb = Number(p?.hizb || 0);
    if (surahId && ayah) return toGlobal(surahId, ayah, C);
    if (hizb) return HG.idx[hizb] || 1;
    if (surahId) return surahRange(surahId, C)[1];
    return C[114];
  }

  // End-side surah options that occur at or after the given begin point
  function endSurahsAfter(beginPoint, maybeHizb) {
    const gBegin = globalStartForPoint(beginPoint);
    const base = maybeHizb ? surahsForHizb(maybeHizb) : surahItems;
    return base.filter((opt) => {
      const s = Number(opt.value);
      const [, g2] = surahRange(s, C);
      return g2 >= gBegin; // has at least one ayah after the begin
    });
  }

  // End-side ayah options for a surah/hizb, restricted to >= begin point
  function endAyahsAfter(surahId, maybeHizb, beginPoint) {
    const s = Number(surahId || 0);
    if (!s) return [];
    const gBegin = globalStartForPoint(beginPoint);
    const base = ayahsFor(surahId, maybeHizb);
    return base.filter((opt) => toGlobal(s, Number(opt.value), C) >= gBegin);
  }

  // Reversed-direction end options (for Juz Amma style): end must be at or BEFORE begin
  function endSurahsBefore(beginPoint, maybeHizb) {
    const gBound = globalEndForPoint(beginPoint);
    const base = maybeHizb ? surahsForHizb(maybeHizb) : surahItems;
    return base.filter((opt) => {
      const s = Number(opt.value);
      const [g1] = surahRange(s, C);
      return g1 <= gBound; // surah starts at or before the bound
    });
  }

  function endAyahsBefore(surahId, maybeHizb, beginPoint) {
    const s = Number(surahId || 0);
    if (!s) return [];
    const gBound = globalEndForPoint(beginPoint);
    const base = ayahsFor(surahId, maybeHizb);
    return base.filter((opt) => toGlobal(s, Number(opt.value), C) <= gBound);
  }

  return {
    loading,
    surahItems,
    hizbItemsAll,
    hizbsForSurah,
    surahsForHizb,
    ayahsFor,
    hizbFor,
    globalStartForPoint,
    globalEndForPoint,
    endSurahsAfter,
    endAyahsAfter,
    endSurahsBefore,
    endAyahsBefore,
  };
}
