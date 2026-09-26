// Comic lettering for UI copy: '*word*' becomes bold (the stressed word, Blambot "Comic Book Grammar & Tradition").
export const say = (text = '') => text.split('*').map((t, i) => (i % 2 ? <b key={i}>{t}</b> : t));
