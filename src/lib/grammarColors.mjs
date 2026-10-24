// Shared keys for the article (gender) color system: der blue, die red, das green, plural purple.
export const GENDER_KEYS = { m: 'der', f: 'die', n: 'das', pl: 'pl', der: 'der', die: 'die', das: 'das' };
export const GENDER_LABELS = { der: '陽性 der', die: '陰性 die', das: '中性 das', pl: '複數' };

export function genderKey(value) {
  return GENDER_KEYS[String(value || '').trim().toLowerCase()] || null;
}

// "der Kaffee" → { article: 'der', rest: 'Kaffee', gender: 'der' }; anything without an article has no gender.
export function splitArticle(phrase) {
  const [first, ...rest] = String(phrase || '').trim().split(/\s+/);
  const gender = ['der', 'die', 'das'].includes(first?.toLowerCase()) ? first.toLowerCase() : null;
  return gender ? { article: first, rest: rest.join(' '), gender } : { article: '', rest: String(phrase || ''), gender: null };
}
