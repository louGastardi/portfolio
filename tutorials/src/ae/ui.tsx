import React from "react";
import { AbsoluteFill } from "remotion";
import { LH, LW, Pt, Rect, SCALE, inside, tw, easeOut, timecode } from "./anim";

// After Effects 2024 dark UI palette
export const C = {
  bg: "#1d1d1d",
  panel: "#232323",
  header: "#2b2b2b",
  line: "#3a3a3a",
  rowA: "#262626",
  rowB: "#2a2a2a",
  sel: "#3d3d3d",
  text: "#c8c8c8",
  bright: "#ececec",
  dim: "#8a8a8a",
  blue: "#2d8ceb",
  lime: "#91C11E",
  menu: "#2c2c2e",
  menuHi: "#0a63d8",
};

export const FONT =
  "Inter, -apple-system, 'SF Pro Text', 'Helvetica Neue', system-ui, sans-serif";

// Fixed workspace geometry (logical px)
export const G = {
  project: { x: 4, y: 44, w: 186, h: 256 },
  viewer: { x: 194, y: 44, w: 466, h: 256 },
  right: { x: 664, y: 44, w: 332, h: 463 },
  timeline: { x: 4, y: 304, w: 656, h: 203 },
  comp: { x: 249, y: 72, w: 356, h: 200 }, // comp canvas inside the viewer
  trackX0: 258,
  trackX1: 650,
};

export const Stage: React.FC<{ children: React.ReactNode; cam?: { s: number; x: number; y: number } }> = ({
  children,
  cam,
}) => {
  const s = cam?.s ?? 1;
  // Camera: zoom s around focus point (x, y), clamped so the frame stays filled
  const fx = cam?.x ?? LW / 2;
  const fy = cam?.y ?? LH / 2;
  const tx = Math.min(0, Math.max(LW - LW * s, LW / 2 - fx * s));
  const ty = Math.min(0, Math.max(LH - LH * s, LH / 2 - fy * s));
  return (
    <AbsoluteFill style={{ backgroundColor: C.bg, fontFamily: FONT, overflow: "hidden" }}>
      <div
        style={{
          position: "absolute",
          width: LW,
          height: LH,
          transformOrigin: "0 0",
          transform: `scale(${SCALE}) translate(${tx}px, ${ty}px) scale(${s})`,
          background: C.bg,
          color: C.text,
          fontSize: 11,
          WebkitFontSmoothing: "antialiased",
        }}
      >
        {children}
      </div>
    </AbsoluteFill>
  );
};

export const Abs: React.FC<{ r: Rect; style?: React.CSSProperties; children?: React.ReactNode }> = ({
  r,
  style,
  children,
}) => (
  <div style={{ position: "absolute", left: r.x, top: r.y, width: r.w, height: r.h, ...style }}>{children}</div>
);

export const MENUS = ["File", "Edit", "Composition", "Layer", "Effect", "Animation", "View", "Window", "Help"];
// x position of each menu title, for menus and cursor targets
export const menuRects: Rect[] = (() => {
  let x = 92;
  return MENUS.map((m) => {
    const w = m.length * 6.1 + 12;
    const r = { x, y: 2, w, h: 16 };
    x += w + 2;
    return r;
  });
})();

export const MenuBar: React.FC<{ open?: string }> = ({ open }) => (
  <div style={{ position: "absolute", left: 0, top: 0, width: LW, height: 20, background: "#2a2a2a", borderBottom: `1px solid #151515` }}>
    <div style={{ position: "absolute", left: 14, top: 4, fontWeight: 700, color: C.bright, fontSize: 11.5 }}>After Effects</div>
    {MENUS.map((m, i) => (
      <div
        key={m}
        style={{
          position: "absolute",
          left: menuRects[i].x,
          top: 2,
          height: 16,
          width: menuRects[i].w,
          borderRadius: 4,
          background: open === m ? C.menuHi : "transparent",
          color: open === m ? "#fff" : C.bright,
          fontSize: 11.5,
          lineHeight: "16px",
          textAlign: "center",
        }}
      >
        {m}
      </div>
    ))}
    <div style={{ position: "absolute", right: 14, top: 4, fontSize: 11, color: C.text }}>Wed 10:24</div>
  </div>
);

const ToolIcon: React.FC<{ d: React.ReactNode; on?: boolean }> = ({ d, on }) => (
  <div style={{ width: 22, height: 18, borderRadius: 3, background: on ? "#3f3f3f" : "transparent", display: "flex", alignItems: "center", justifyContent: "center" }}>
    <svg width="13" height="13" viewBox="0 0 14 14" fill="none" stroke={on ? C.blue : "#b8b8b8"} strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round">
      {d}
    </svg>
  </div>
);

export const Toolbar: React.FC = () => (
  <div style={{ position: "absolute", left: 0, top: 20, width: LW, height: 22, background: C.panel, borderBottom: `1px solid #151515`, display: "flex", alignItems: "center", padding: "0 6px", gap: 2 }}>
    <ToolIcon d={<path d="M2 7 L7 2.5 L12 7 M3.5 6 V12 H10.5 V6" />} />
    <ToolIcon on d={<path d="M3 2 V12 L6 9 L8 13 L9.5 12.3 L7.6 8.5 H11 Z" fill="none" />} />
    <ToolIcon d={<path d="M4 8 V4 M6 7 V2.5 M8 7 V3 M10 8 V4.5 M4 8 C4 11 6 12.5 8 12.5 C10 12.5 10 10 10 8" />} />
    <ToolIcon d={<><circle cx="6" cy="6" r="3.6" /><path d="M8.8 8.8 L12.5 12.5" /></>} />
    <ToolIcon d={<path d="M11 6 A4.5 4.5 0 1 0 10 10 M11 2.5 V6 H7.5" />} />
    <ToolIcon d={<><rect x="2" y="4" width="8" height="7" rx="1" /><path d="M10 6.5 L12.5 5 V10 L10 8.5" /></>} />
    <ToolIcon d={<><circle cx="7" cy="7" r="2" /><path d="M7 1.5 V3.5 M7 10.5 V12.5 M1.5 7 H3.5 M10.5 7 H12.5" /></>} />
    <div style={{ width: 1, height: 14, background: C.line, margin: "0 4px" }} />
    <ToolIcon d={<rect x="2.5" y="3" width="9" height="8" rx="0.5" />} />
    <ToolIcon d={<path d="M7 2 L11 9 L7 12.5 L3 9 Z M7 2 V7" />} />
    <ToolIcon d={<path d="M3 3 H11 M7 3 V12" />} />
    <ToolIcon d={<path d="M3 11 C5 9 6 6 11 2.5" />} />
    <ToolIcon d={<path d="M3 11 L6 5 L8 8 L11 3" />} />
    <ToolIcon d={<path d="M4 10 L9 3 L12 5.5 L7 12 H4 Z" />} />
    <div style={{ flex: 1 }} />
    {["Default", "Learn", "Standard", "Small Screen", "Libraries"].map((w, i) => (
      <div key={w} style={{ padding: "0 8px", fontSize: 10.5, color: i === 0 ? C.blue : C.dim, borderBottom: i === 0 ? `1.5px solid ${C.blue}` : "none", lineHeight: "16px" }}>
        {w}
      </div>
    ))}
  </div>
);

// Docked panel with a tab strip
export const Panel: React.FC<{ r: Rect; tabs: string[]; active?: number; children?: React.ReactNode; focus?: boolean }> = ({
  r,
  tabs,
  active = 0,
  children,
  focus,
}) => (
  <Abs r={r} style={{ background: C.panel, borderRadius: 3, overflow: "hidden", outline: focus ? `1px solid ${C.blue}` : "none" }}>
    <div style={{ height: 18, display: "flex", alignItems: "flex-end", gap: 2, padding: "0 6px", background: C.panel, borderBottom: `1px solid #1a1a1a` }}>
      {tabs.map((t, i) => (
        <div
          key={t}
          style={{
            fontSize: 11,
            lineHeight: "16px",
            padding: "0 8px",
            color: i === active ? C.bright : C.dim,
            borderBottom: i === active ? `1.5px solid #9a9a9a` : "1.5px solid transparent",
            whiteSpace: "nowrap",
          }}
        >
          {t}
        </div>
      ))}
      <div style={{ flex: 1 }} />
      <div style={{ color: C.dim, fontSize: 12, lineHeight: "16px" }}>≡</div>
    </div>
    <div style={{ position: "absolute", left: 0, top: 18, right: 0, bottom: 0 }}>{children}</div>
  </Abs>
);

export const ProjectPanel: React.FC<{ items: { name: string; kind: "comp" | "img" | "folder" | "audio" | "text" }[] }> = ({ items }) => (
  <Panel r={G.project} tabs={["Project", "Effect Controls"]}>
    <div style={{ display: "flex", gap: 8, padding: 8 }}>
      <div style={{ width: 54, height: 32, background: "#111", border: `1px solid ${C.line}` }} />
      <div style={{ fontSize: 10, color: C.dim, lineHeight: "13px" }}>
        <div style={{ color: C.text }}>Main</div>
        1920 x 1080 (1.00)
        <br />Δ 0:00:10:00, 30 fps
      </div>
    </div>
    <div style={{ margin: "0 8px 6px", height: 16, borderRadius: 8, background: "#1b1b1b", color: C.dim, fontSize: 10, padding: "0 8px", lineHeight: "16px" }}>⌕</div>
    <div style={{ display: "flex", fontSize: 10, color: C.dim, padding: "2px 8px", borderBottom: `1px solid ${C.line}`, borderTop: `1px solid ${C.line}` }}>
      <div style={{ flex: 1 }}>Name</div>
      <div style={{ width: 50 }}>Type</div>
    </div>
    {items.map((it, i) => (
      <div key={it.name} style={{ display: "flex", alignItems: "center", gap: 6, padding: "0 8px", height: 16, fontSize: 10.5, background: i % 2 ? "transparent" : "#262626" }}>
        <ItemIcon kind={it.kind} />
        <div style={{ flex: 1, color: C.text, whiteSpace: "nowrap" }}>{it.name}</div>
        <div style={{ width: 50, color: C.dim, fontSize: 10 }}>
          {{ comp: "Composition", img: "Image", folder: "Folder", audio: "Audio", text: "Text" }[it.kind]}
        </div>
      </div>
    ))}
  </Panel>
);

export const ItemIcon: React.FC<{ kind: string }> = ({ kind }) => {
  const color = { comp: "#8a9bd6", img: "#b9a26a", folder: "#c9a54a", audio: "#5fb38a", text: "#d06a6a", shape: "#6a8ed0" }[kind] ?? "#999";
  return <div style={{ width: 10, height: 8, borderRadius: kind === "folder" ? "1px 3px 1px 1px" : 1.5, background: color, opacity: 0.9 }} />;
};

// Composition viewer frame. Children render inside the comp canvas (comp px are scaled to fit).
export const Viewer: React.FC<{ t: number; children?: React.ReactNode; zoomLabel?: string }> = ({ t, children }) => (
  <Panel r={G.viewer} tabs={["Composition  Main", "Layer  (none)"]}>
    <div style={{ position: "absolute", left: 0, top: 0, right: 0, bottom: 18, background: "#1f1f1f" }} />
    <div
      style={{
        position: "absolute",
        left: G.comp.x - G.viewer.x,
        top: G.comp.y - G.viewer.y - 18,
        width: G.comp.w,
        height: G.comp.h,
        background: "#000",
        overflow: "hidden",
        boxShadow: "0 0 0 1px #000",
      }}
    >
      <div style={{ position: "absolute", left: 0, top: 0, width: 1920, height: 1080, transformOrigin: "0 0", transform: `scale(${G.comp.w / 1920})` }}>
        {children}
      </div>
    </div>
    <div style={{ position: "absolute", left: 0, right: 0, bottom: 0, height: 18, background: C.panel, borderTop: `1px solid #1a1a1a`, display: "flex", alignItems: "center", gap: 10, padding: "0 8px", fontSize: 10, color: C.dim }}>
      <span>50% ▾</span>
      <span style={{ color: C.blue }}>{timecode(t)}</span>
      <span>Full ▾</span>
      <span>Active Camera ▾</span>
      <span>1 View ▾</span>
    </div>
  </Panel>
);

// ScriptUI widgets
export const SGroup: React.FC<{ r: Rect; title: string }> = ({ r, title }) => (
  <>
    <Abs r={{ x: r.x, y: r.y + 6, w: r.w, h: r.h - 6 }} style={{ border: "1px solid #4a4a4a", borderRadius: 4 }} />
    <div style={{ position: "absolute", left: r.x + 8, top: r.y, padding: "0 3px", background: C.panel, fontSize: 10.5, color: C.text, lineHeight: "12px", whiteSpace: "nowrap" }}>{title}</div>
  </>
);

export const SButton: React.FC<{ r: Rect; label: string; cursor: Pt; down: boolean }> = ({ r, label, cursor, down }) => {
  const hover = inside(cursor, r);
  const pressed = hover && down;
  return (
    <Abs
      r={r}
      style={{
        borderRadius: 4,
        border: `1px solid ${pressed ? "#5aa6f5" : hover ? "#7a7a7a" : "#555"}`,
        background: pressed ? C.blue : hover ? "#474747" : "#333",
        color: pressed || hover ? "#fff" : C.text,
        fontSize: 11,
        lineHeight: `${r.h - 2}px`,
        textAlign: "center",
        whiteSpace: "nowrap",
        boxSizing: "border-box",
      }}
    >
      {label}
    </Abs>
  );
};

export const SField: React.FC<{ r: Rect; text: string; dim?: boolean }> = ({ r, text, dim }) => (
  <Abs
    r={r}
    style={{ background: "#1a1a1a", border: "1px solid #575757", borderRadius: 2, color: dim ? C.dim : C.bright, fontSize: 10.5, lineHeight: `${r.h - 2}px`, padding: "0 4px", boxSizing: "border-box", overflow: "hidden", whiteSpace: "nowrap" }}
  >
    {text}
  </Abs>
);

export const SLabel: React.FC<{ x: number; y: number; h: number; text: string }> = ({ x, y, h, text }) => (
  <div style={{ position: "absolute", left: x, top: y, lineHeight: `${h}px`, fontSize: 11, color: C.text, whiteSpace: "nowrap" }}>{text}</div>
);

// macOS arrow pointer
export const Cursor: React.FC<{ p: Pt; down: boolean }> = ({ p, down }) => (
  <svg
    width="17"
    height="24"
    viewBox="-1 -1 15 21"
    style={{ position: "absolute", left: p.x - 1, top: p.y - 1, transform: `scale(${down ? 0.88 : 1})`, transformOrigin: "1px 1px", filter: "drop-shadow(0 1px 1.5px rgba(0,0,0,.55))", zIndex: 50 }}
  >
    <path d="M0 0 V16.2 L3.9 12.5 L6.6 18.6 L9.3 17.4 L6.7 11.5 H12 Z" fill="#fff" stroke="#000" strokeWidth="1.1" strokeLinejoin="round" />
  </svg>
);

// Lime ring on every click
export const Ripples: React.FC<{ f: number; clicks: { f: number; p: Pt }[] }> = ({ f, clicks }) => (
  <>
    {clicks
      .filter((c) => f >= c.f && f < c.f + 16)
      .map((c) => {
        const k = (f - c.f) / 16;
        const r = 3 + 13 * easeOut(k);
        return (
          <div
            key={c.f}
            style={{
              position: "absolute",
              left: c.p.x - r,
              top: c.p.y - r,
              width: r * 2,
              height: r * 2,
              borderRadius: "50%",
              border: `2px solid ${C.lime}`,
              background: "rgba(145,193,30,.18)",
              opacity: 1 - k,
              boxSizing: "border-box",
              zIndex: 49,
            }}
          />
        );
      })}
  </>
);

// Small key hint next to the cursor, e.g. ⌘A
export const KeyChip: React.FC<{ f: number; from: number; to: number; label: string; p: Pt }> = ({ f, from, to, label, p }) => {
  if (f < from || f > to) return null;
  const o = Math.min(tw(f, from, from + 5, 0, 1), tw(f, to - 5, to, 1, 0));
  return (
    <div style={{ position: "absolute", left: p.x + 16, top: p.y + 16, opacity: o, background: "#f2f2f2", color: "#111", fontSize: 11, fontWeight: 700, padding: "2px 6px", borderRadius: 4, boxShadow: "0 2px 0 #9a9a9a", zIndex: 51 }}>
      {label}
    </div>
  );
};

// Step captions, bottom left, in output px (outside the logical stage)
export const Captions: React.FC<{ f: number; steps: { from: number; to: number; text: string }[] }> = ({ f, steps }) => (
  <>
    {steps
      .filter((s) => f >= s.from && f < s.to)
      .map((s) => {
        const o = Math.min(tw(f, s.from, s.from + 8, 0, 1), tw(f, s.to - 8, s.to, 1, 0));
        const y = tw(f, s.from, s.from + 10, 14, 0, easeOut);
        return (
          <div
            key={s.text}
            style={{
              position: "absolute",
              left: 30,
              bottom: 26,
              opacity: o,
              transform: `translateY(${y}px)`,
              background: C.lime,
              color: "#141a06",
              fontFamily: FONT,
              fontWeight: 650,
              fontSize: 34,
              padding: "10px 20px 12px",
              borderRadius: 7,
              boxShadow: "0 6px 18px rgba(0,0,0,.45)",
              whiteSpace: "nowrap",
            }}
          >
            {s.text}
          </div>
        );
      })}
  </>
);
