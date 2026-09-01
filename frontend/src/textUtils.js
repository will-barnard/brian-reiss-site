// Shared helpers for "Show more" truncation of long, admin-authored text
// (book/merch descriptions, appearance journal entries, artist blurbs, the
// About bio, Q&A answers) so a long entry doesn't blow up the page height.

// Character count above which text gets collapsed by default.
export const DESCRIPTION_LIMIT = 320;

function clean(text) {
  return (text || '').replace(/\s+/g, ' ').trim();
}

// Is this text long enough to need a "Show more" toggle?
export function isTextLong(text, limit = DESCRIPTION_LIMIT) {
  return clean(text).length > limit;
}

// Truncate to `limit` chars, breaking on a word boundary where reasonable,
// with a trailing ellipsis.
export function truncateText(text, limit = DESCRIPTION_LIMIT) {
  const str = clean(text);
  if (str.length <= limit) return str;
  const cut = str.slice(0, limit);
  const lastSpace = cut.lastIndexOf(' ');
  const safe = lastSpace > limit * 0.6 ? cut.slice(0, lastSpace) : cut;
  return safe.trimEnd() + '…';
}
