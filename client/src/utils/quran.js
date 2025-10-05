export function serializePoint(point) {
  if (point.surahId && point.ayah) return `${point.surahId}:${point.ayah}`;
  if (point.hizb) return `hizb:${point.hizb}`;
  return '';
}

export function parsePoint(raw) {
  if (!raw) return { surahId: '', ayah: '', hizb: '' };
  if (raw.startsWith('hizb:'))
    return { surahId: '', ayah: '', hizb: raw.split(':')[1] || '' };
  const parts = raw.split(':');
  if (parts.length === 2)
    return { surahId: parts[0] || '', ayah: parts[1] || '', hizb: '' };
  return { surahId: '', ayah: '', hizb: '' };
}
