import { useEffect, useMemo, useState } from "react";
import { getChapters } from "@/apis/quranAPI";

export function useQuranMeta() {
  const [chapters, setChapters] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let on = true;
    getChapters().then(cs => { if (on) { setChapters(cs); setLoading(false); } });
    return () => { on = false; };
  }, []);

  const hizbOptions = useMemo(() => Array.from({ length: 60 }, (_, i) => i + 1), []);
  const byId = useMemo(() => new Map(chapters.map(c => [c.id, c])), [chapters]);

  function ayahsForSurah(surahId) {
    const c = byId.get(Number(surahId));
    if (!c) return [];
    return Array.from({ length: c.verses_count }, (_, i) => i + 1);
  }

  return { chapters, hizbOptions, ayahsForSurah, loading };
}
