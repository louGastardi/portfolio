import React from "react";
import { Rect, timecode } from "./anim";
import { Abs, C, G, ItemIcon, Panel } from "./ui";

export type TLayer = {
  name: string;
  kind: "text" | "shape" | "img";
  color: string; // label color
  inT: number;
  outT: number;
  selected?: boolean;
  dim?: number; // 0..1, fades the bar (used while a strip is drawn)
};

export const RULER_Y = 322;
export const HEAD_Y = 344;

export const tlX = (t: number, dur: number) => G.trackX0 + (t / dur) * (G.trackX1 - G.trackX0);

export const rowRect = (i: number, top: number, h: number): Rect => ({ x: G.timeline.x, y: top + i * h, w: G.timeline.w, h });

export const Timeline: React.FC<{
  dur: number;
  t: number;
  layers: TLayer[];
  rowsTop: number;
  rowH: number;
  children?: React.ReactNode; // extra content in stage coords, drawn above the rows
}> = ({ dur, t, layers, rowsTop, rowH, children }) => {
  const L = G.timeline;
  const ticks = Array.from({ length: dur + 1 }, (_, i) => i);
  const ph = tlX(t, dur);
  return (
    <>
      <Panel r={L} tabs={["×  Main", "Render Queue"]} />
      {/* time + search row */}
      <div style={{ position: "absolute", left: L.x + 8, top: RULER_Y - 1, fontSize: 13, fontWeight: 600, color: C.blue, letterSpacing: 0.2 }}>{timecode(t)}</div>
      <div style={{ position: "absolute", left: L.x + 8, top: RULER_Y + 14, fontSize: 7.5, color: C.dim }}>{String(Math.round(t * 30)).padStart(5, "0")} (30.00 fps)</div>
      <Abs r={{ x: L.x + 100, y: RULER_Y + 4, w: 100, h: 15 }} style={{ background: "#1b1b1b", borderRadius: 8, fontSize: 9.5, color: C.dim, padding: "0 7px", lineHeight: "15px", boxSizing: "border-box" }}>⌕</Abs>
      {/* ruler */}
      <Abs r={{ x: G.trackX0 - 4, y: RULER_Y, w: G.trackX1 - G.trackX0 + 10, h: 22 }} style={{ background: "#262626" }} />
      <Abs r={{ x: G.trackX0, y: RULER_Y + 2, w: G.trackX1 - G.trackX0, h: 4 }} style={{ background: "#4a4a4a", borderRadius: 2 }} />
      {ticks.map((s) => (
        <React.Fragment key={s}>
          <div style={{ position: "absolute", left: tlX(s, dur), top: RULER_Y + 13, width: 1, height: 9, background: "#666" }} />
          <div style={{ position: "absolute", left: tlX(s, dur) + 2, top: RULER_Y + 6, fontSize: 8.5, color: C.dim }}>{String(s).padStart(2, "0")}s</div>
          {s < dur && <div style={{ position: "absolute", left: (tlX(s, dur) + tlX(s + 1, dur)) / 2, top: RULER_Y + 18, width: 1, height: 4, background: "#555" }} />}
        </React.Fragment>
      ))}
      {/* column header */}
      <Abs r={{ x: L.x, y: HEAD_Y, w: G.trackX0 - L.x - 4, h: 16 }} style={{ background: "#262626", borderTop: `1px solid #1a1a1a`, borderBottom: `1px solid #1a1a1a`, fontSize: 9.5, color: C.dim }}>
        <div style={{ position: "absolute", left: 8, top: 4, width: 9, height: 7, borderRadius: "50%", border: "1.2px solid #777", boxSizing: "border-box" }} />
        <div style={{ position: "absolute", left: 82, top: 2 }}>#</div>
        <div style={{ position: "absolute", left: 112, top: 2 }}>Layer Name</div>
        <div style={{ position: "absolute", left: 200, top: 2 }}>Mode</div>
      </Abs>
      <Abs r={{ x: G.trackX0 - 4, y: HEAD_Y, w: G.trackX1 - G.trackX0 + 10, h: 16 }} style={{ background: "#202020", borderTop: `1px solid #1a1a1a`, borderBottom: `1px solid #1a1a1a` }} />
      {/* rows */}
      {layers.map((ly, i) => {
        const y = rowsTop + i * rowH;
        const x0 = tlX(ly.inT, dur);
        const x1 = tlX(ly.outT, dur);
        return (
          <React.Fragment key={ly.name}>
            <Abs r={{ x: L.x, y, w: G.trackX0 - L.x - 4, h: rowH }} style={{ background: ly.selected ? C.sel : i % 2 ? C.rowB : C.rowA, borderBottom: `1px solid #1c1c1c`, boxSizing: "border-box" }}>
              <div style={{ position: "absolute", left: 8, top: rowH / 2 - 4, width: 9, height: 7, borderRadius: "50%", border: "1.2px solid #9a9a9a", boxSizing: "border-box" }} />
              <div style={{ position: "absolute", left: 22, top: rowH / 2 - 3.5, width: 7, height: 7, border: "1px solid #555", boxSizing: "border-box" }} />
              <div style={{ position: "absolute", left: 34, top: rowH / 2 - 3.5, width: 7, height: 7, border: "1px solid #555", boxSizing: "border-box" }} />
              <div style={{ position: "absolute", left: 66, top: rowH / 2 - 4, width: 9, height: 8, background: ly.color, borderRadius: 1 }} />
              <div style={{ position: "absolute", left: 82, top: 0, lineHeight: `${rowH}px`, fontSize: 10.5, color: C.dim }}>{i + 1}</div>
              <div style={{ position: "absolute", left: 98, top: rowH / 2 - 4 }}>
                <ItemIcon kind={ly.kind} />
              </div>
              <div style={{ position: "absolute", left: 112, top: 0, lineHeight: `${rowH}px`, fontSize: 11, color: ly.selected ? "#fff" : C.text, whiteSpace: "nowrap" }}>{ly.name}</div>
              <div style={{ position: "absolute", left: 200, top: 0, lineHeight: `${rowH}px`, fontSize: 10, color: C.dim }}>Normal ▾</div>
            </Abs>
            <Abs r={{ x: G.trackX0 - 4, y, w: G.trackX1 - G.trackX0 + 10, h: rowH }} style={{ background: i % 2 ? "#232323" : "#202020", borderBottom: `1px solid #1c1c1c`, boxSizing: "border-box" }} />
            <Abs
              r={{ x: x0, y: y + 2, w: Math.max(2, x1 - x0), h: rowH - 4 }}
              style={{
                background: ly.color,
                opacity: (ly.selected ? 1 : 0.78) * (1 - (ly.dim ?? 0) * 0.5),
                borderRadius: 2,
                boxShadow: ly.selected ? "inset 0 0 0 1px rgba(255,255,255,.75)" : "inset 0 1px 0 rgba(255,255,255,.18)",
              }}
            />
          </React.Fragment>
        );
      })}
      {children}
      {/* playhead */}
      <div style={{ position: "absolute", left: ph - 0.5, top: RULER_Y + 2, width: 1.2, height: L.y + L.h - RULER_Y - 4, background: C.blue, zIndex: 5 }} />
      <svg width="11" height="12" viewBox="0 0 11 12" style={{ position: "absolute", left: ph - 5.5, top: RULER_Y + 1, zIndex: 5 }}>
        <path d="M0.5 0.5 H10.5 V7 L5.5 11.5 L0.5 7 Z" fill={C.blue} />
      </svg>
    </>
  );
};
