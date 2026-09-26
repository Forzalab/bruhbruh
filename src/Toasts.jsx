import { CAPTION } from './captionLettering.js';

// Toasts = comic CAPTION boxes: system news with no speaker (speech balloons stay for parts and the wordmark).
// Stack at the canvas's lower right (clear of the demo switches), newest at the bottom next to the frame edge (M3 snackbar: bottom of the window,
// content enters from there); older ones rise. Each leaves after 4s (M3 snackbar: 4-10s; short, since none carries
// an action). Gap = 20u, one canvas grid line (snapGrid 20): the stack keeps the canvas rhythm.
export const TOAST_MS = 3000; // Tony: 3 s max

export default function Toasts({ list }) {
  return (
    <div className="toasts" role="status">
      {list.map((t) => {
        const c = CAPTION[t.phrase];
        return (
          <p key={t.id} className="toast" style={{ '--w': c.w, '--h': c.h }}>
            <span className="sr">{c.text}</span>
            <svg viewBox={`0 0 ${c.w} ${c.h}`} aria-hidden="true">
              <rect className="box" x="0" y="0" width={c.w} height={c.h} />
              <path d={c.d} />
            </svg>
          </p>
        );
      })}
    </div>
  );
}
