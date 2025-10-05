let _chapters = null;

export async function getChapters() {
  if (_chapters) return _chapters;
  const r = await fetch("https://api.quran.com/api/v4/chapters");
  const j = await r.json();
  _chapters = j.chapters || [];
  return _chapters;
}

// helpers
export async function getVersesByHizb(n) {
  const r = await fetch(`https://api.quran.com/api/v4/verses/by_hizb/${n}`);
  return (await r.json()).verses || [];
}

export async function getAyah(ch, v) {
  const r = await fetch(`https://api.quran.com/api/v4/verses/by_key/${ch}:${v}`);
  return (await r.json()).verse;
}
