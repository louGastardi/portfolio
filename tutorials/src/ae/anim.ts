import { Easing, interpolate } from "remotion";

// The UI is laid out in a 1000 x 511 logical space and scaled to 1800 x 920,
// so 11 to 13px UI text stays legible once the video is shown in a small card.
export const LW = 1000;
export const LH = 511;
export const SCALE = 1.8;

export const easeInOut = Easing.bezier(0.45, 0, 0.2, 1);
export const easeOut = Easing.bezier(0.16, 1, 0.3, 1);
// After Effects' ease() is a smooth in/out curve
export const aeEase = Easing.inOut(Easing.cubic);

// Clamped tween between two frames
export const tw = (
  f: number,
  a: number,
  b: number,
  from: number,
  to: number,
  easing: (t: number) => number = easeInOut,
) =>
  interpolate(f, [a, b], [from, to], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing,
  });

export type Pt = { x: number; y: number };
export type Move = { at: number; dur: number; x: number; y: number };

// Cursor position: eased moves between targets, holding still in between
export const cursorAt = (f: number, start: Pt, moves: Move[]): Pt => {
  let pos = start;
  for (const m of moves) {
    if (f >= m.at + m.dur) {
      pos = { x: m.x, y: m.y };
      continue;
    }
    if (f >= m.at) {
      const p = easeInOut((f - m.at) / m.dur);
      return { x: pos.x + (m.x - pos.x) * p, y: pos.y + (m.y - pos.y) * p };
    }
    break;
  }
  return pos;
};

export type Rect = { x: number; y: number; w: number; h: number };
export const inside = (p: Pt, r: Rect) =>
  p.x >= r.x && p.x <= r.x + r.w && p.y >= r.y && p.y <= r.y + r.h;
export const center = (r: Rect): Pt => ({ x: r.x + r.w / 2, y: r.y + r.h / 2 + 1 });

// Mouse button state: a click is pressed for 5 frames, a drag between two frames
export const isDown = (f: number, clicks: number[], drags: [number, number][] = []) =>
  clicks.some((c) => f >= c && f < c + 5) || drags.some(([a, b]) => f >= a && f < b);

// Rough text width for the system UI font, used to size ScriptUI buttons
export const textW = (s: string, size = 11) => {
  let w = 0;
  for (const ch of s) {
    if ("il.,:;'|!()[] ".includes(ch)) w += 0.3;
    else if ("mwMW…".includes(ch)) w += 0.85;
    else if (ch >= "A" && ch <= "Z") w += 0.66;
    else if ("←→↑↓%+".includes(ch)) w += 0.7;
    else w += 0.55;
  }
  return w * size;
};

// "0:00:01:12" at 30 fps
export const timecode = (t: number) => {
  const s = Math.floor(t + 1e-6);
  const fr = Math.min(29, Math.floor((t - s) * 30 + 1e-6));
  const pad = (n: number) => String(n).padStart(2, "0");
  return `0:00:${pad(s)}:${pad(fr)}`;
};

// Camera keyframes: [frame, zoom, focusX, focusY], eased between keys
export type CamKey = [number, number, number, number];
export const camAt = (f: number, keys: CamKey[]) => {
  if (f <= keys[0][0]) return { s: keys[0][1], x: keys[0][2], y: keys[0][3] };
  for (let i = 1; i < keys.length; i++) {
    const [f1, s1, x1, y1] = keys[i];
    const [f0, s0, x0, y0] = keys[i - 1];
    if (f <= f1) {
      const p = easeInOut((f - f0) / Math.max(1, f1 - f0));
      return { s: s0 + (s1 - s0) * p, x: x0 + (x1 - x0) * p, y: y0 + (y1 - y0) * p };
    }
  }
  const k = keys[keys.length - 1];
  return { s: k[1], x: k[2], y: k[3] };
};
