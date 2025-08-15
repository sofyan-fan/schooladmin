export function strength(pw) {
  let score = 0;
  if (pw.length >= 8) score++;
  if (/[A-Z]/.test(pw)) score++;
  if (/[0-9]/.test(pw)) score++;
  if (/[^A-Za-z0-9]/.test(pw)) score++;
  return {
    score,
    label:
      ['Zwak', 'Matig', 'Gemiddeld', 'Sterk', 'Zeer sterk'][score] || 'Zwak',
  };
}

export function coerceToIso(dateLike) {
  if (dateLike instanceof Date) {
    return dateLike.toISOString();
  }
  if (typeof dateLike === 'string') {
    const d = new Date(dateLike);
    if (!isNaN(d.getTime())) {
      return d.toISOString();
    }
  }
  return null;
}

export function minStudentBirthDate() {
  const today = new Date();
  const minAgeYears = 4;
  const cutoff = new Date(
    today.getFullYear() - minAgeYears,
    today.getMonth(),
    today.getDate()
  );
  return cutoff;
}
