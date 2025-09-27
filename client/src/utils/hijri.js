const WEEKDAYS = [
  'Yawm al-Ahad',
  'Yawm al-Ithnayn',
  'Yawm ath-Thulatha',
  'Yawm al-Arbia',
  'Yawm al-Khamis',
  'Yawm al-Jumah',
  'Yawm as-Sabt',
];

export function formatHijri(date = new Date()) {
  const weekday = WEEKDAYS[date.getDay()] || '';
  const opts = {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  };
  const locales = [
    'nl-NL-u-ca-islamic-umalqura-nu-latn',
    'nl-NL-u-ca-islamic-nu-latn',
    'en-GB-u-ca-islamic-umalqura-nu-latn',
    'ar-SA-u-ca-islamic-umalqura',
  ];
  for (const loc of locales) {
    try {
      const parts = new Intl.DateTimeFormat(loc, opts).formatToParts(date);
      const dayPart = parts.find((p) => p.type === 'day')?.value || '';
      const monthPart = parts.find((p) => p.type === 'month')?.value || '';
      const yearPart = parts.find((p) => p.type === 'year')?.value || '';

      const body = [dayPart, monthPart, yearPart].filter(Boolean).join(' - ');
      return `${weekday} ${body}`.trim();
    } catch {
      // Try next locale
    }
  }
  return weekday;
}
