// Convert "s:a" to { s, a }
export function keyToPair(key) {
    const [s, a] = key.split(":").map(Number);
    return { s, a };
  }
  
  export function buildCumulative(versesCountBySurah /* 1..114 */) {
    const C = [0];
    for (let s = 1; s <= 114; s++) C[s] = C[s - 1] + versesCountBySurah[s];
    return C; // C[s] = total verses up to and including surah s
  }
  
  export function toGlobal(s, a, C) {
    return C[s - 1] + a;
  }
  
  export function fromGlobal(G, C) {
    let lo = 1, hi = 114, s = 1;
    while (lo <= hi) {
      const mid = (lo + hi) >> 1;
      if (C[mid] >= G) { s = mid; hi = mid - 1; } else { lo = mid + 1; }
    }
    const a = G - C[s - 1];
    return { s, a };
  }
  
  // Surah global range [g1, g2]
  export function surahRange(s, C) {
    return [C[s - 1] + 1, C[s]];
  }
  
  // Hizb global range [g1, g2], given HG[1..60] starts and lastG
  export function hizbRange(h, HG, lastG) {
    const g1 = HG[h];
    const g2 = h < 60 ? HG[h + 1] - 1 : lastG;
    return [g1, g2];
  }
  
  // Ranges intersect
  export function intersects([a1, a2], [b1, b2]) {
    return Math.max(a1, b1) <= Math.min(a2, b2);
  }
  
  // Map a global range intersection back to local ayah numbers of a given surah
  export function ayahRangeForSurahIntersection(s, [g1, g2], C) {
    const [sg1, sg2] = surahRange(s, C);
    const i1 = Math.max(sg1, g1);
    const i2 = Math.min(sg2, g2);
    if (i1 > i2) return null;
    const a1 = i1 - C[s - 1];
    const a2 = i2 - C[s - 1];
    return [a1, a2]; // inclusive local ayah indices
  }
  