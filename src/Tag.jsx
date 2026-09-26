// Part labels that link canvas parts to truth-table columns (T3 draft).
// One component, three looks: 'nyc' (letter in an ink disc), 'swiss' (bare grotesk letter), 'swe' (keyline plate).
// The same <Tag> is drawn on the part and in the table header, so the column head IS the part's label.

// Gate codename pools (<= 5 chars, PG). Order = assignment order (lowest free index wins).
export const NAME_SETS = {
  trad: null, // G1, G2, ...
  bob: ['BOB', 'PAT', 'SANDY', 'SQUID', 'KRABS', 'GARY', 'PEARL', 'PLANK', 'PUFF', 'LARRY', 'KAREN', 'GUS'],
  genz: ['SLAY', 'VIBE', 'BET', 'GOAT', 'MOOD', 'YEET', 'BASED', 'ICON', 'VALID', 'SLAPS', 'FAM', 'EXTRA'],
  alpha: ['AURA', 'SIGMA', 'OHIO', 'RIZZ', 'FANUM', 'MEW', 'NPC', 'SKIBI', 'MOG', 'SUS', 'BRUH', 'W'],
};

// Harness-only look switch (?tag=nyc|swiss|swe&names=trad|bob|genz|alpha&via=1). The spec hardcodes the pick.
const Q = new URLSearchParams(typeof location === 'undefined' ? '' : location.search);
export const LOOK = Q.get('tag') || 'nyc';
export const NAMES = Q.get('names') || 'trad';
export const VIA = Q.get('via') === '1';

// Stable names in creation order: switches A.., lamps 1.., gates from the chosen pool.
export function nameParts(nodes, set = NAMES) {
  const out = {}; let s = 0, l = 0, g = 0;
  for (const n of Object.values(nodes)) {
    if (n.kind === 'S') out[n.id] = String.fromCharCode(65 + s++);
    else if (n.kind === 'L') out[n.id] = String(++l);
    else { const pool = NAME_SETS[set]; out[n.id] = pool ? pool[g % pool.length] : `G${g + 1}`; g++; }
  }
  return out;
}

export default function Tag({ text, look = LOOK, lit = false, className = '' }) {
  return <span className={`tag tag-${look} ${text.length > 1 ? 'wide' : ''} ${lit ? 'lit' : ''} ${className}`} aria-hidden="true">{text}</span>;
}
