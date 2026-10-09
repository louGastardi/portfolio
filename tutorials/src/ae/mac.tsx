import React from "react";
import { easeOut, inside, Pt, Rect, tw } from "./anim";
import { Abs, C, FONT, menuRects } from "./ui";

// ---------- native menus ----------
export type MItem = { label: string; key?: string; sep?: boolean; sub?: boolean; dim?: boolean };
export const ITEM_H = 17;
const SEP_H = 9;

export const menuLayout = (x: number, y: number, w: number, items: MItem[]) => {
  let cy = y + 5;
  const rows = items.map((it) => {
    const h = it.sep ? SEP_H : ITEM_H;
    const r = { x: x + 5, y: cy, w: w - 10, h };
    cy += h;
    return { ...it, r };
  });
  return { box: { x, y, w, h: cy - y + 5 }, rows };
};

export const Menu: React.FC<{ m: ReturnType<typeof menuLayout>; cursor: Pt; forceHi?: string; opacity?: number }> = ({ m, cursor, forceHi, opacity = 1 }) => (
  <>
    <Abs r={m.box} style={{ background: "rgba(44,44,46,.97)", border: "1px solid #4b4b4d", borderRadius: 7, boxShadow: "0 10px 30px rgba(0,0,0,.55)", opacity, zIndex: 20 }} />
    {m.rows.map((it, i) =>
      it.sep ? (
        <Abs key={i} r={{ x: it.r.x + 6, y: it.r.y + 4, w: it.r.w - 12, h: 1 }} style={{ background: "#4a4a4c", opacity, zIndex: 21 }} />
      ) : (
        <Abs
          key={i}
          r={it.r}
          style={{
            zIndex: 21,
            opacity,
            borderRadius: 4,
            background: (inside(cursor, it.r) && !it.dim) || forceHi === it.label ? C.menuHi : "transparent",
            color: it.dim ? "#777" : "#f0f0f0",
            fontSize: 11.5,
            lineHeight: `${ITEM_H}px`,
            padding: "0 10px",
            boxSizing: "border-box",
            display: "flex",
            justifyContent: "space-between",
            whiteSpace: "nowrap",
          }}
        >
          <span>{it.label}</span>
          <span style={{ color: "#a8a8a8" }}>{it.sub ? "›" : it.key ?? ""}</span>
        </Abs>
      ),
    )}
  </>
);

export const FILE_MENU = menuLayout(menuRects[0].x, 20, 232, [
  { label: "New", sub: true },
  { label: "Open Project...", key: "⌘O" },
  { label: "Open Recent", sub: true },
  { label: "", sep: true },
  { label: "Close", key: "⌘W" },
  { label: "Close Project" },
  { label: "Save", key: "⌘S" },
  { label: "Save As", sub: true },
  { label: "Increment and Save", key: "⌥⇧⌘S" },
  { label: "Revert" },
  { label: "", sep: true },
  { label: "Import", sub: true },
  { label: "Export", sub: true },
  { label: "", sep: true },
  { label: "Dependencies", sub: true },
  { label: "Watch Folder..." },
  { label: "", sep: true },
  { label: "Scripts", sub: true },
  { label: "Create Proxy", sub: true },
  { label: "Interpret Footage", sub: true },
  { label: "Replace Footage", sub: true },
  { label: "Reveal in Finder" },
  { label: "", sep: true },
  { label: "Project Settings...", key: "⌥⇧⌘K" },
]);
export const fileRow = (label: string) => FILE_MENU.rows.find((r) => r.label === label)!.r;

const scriptsRow = fileRow("Scripts");
export const SCRIPTS_MENU = menuLayout(FILE_MENU.box.x + FILE_MENU.box.w - 4, scriptsRow.y - 5, 222, [
  { label: "Run Script File..." },
  { label: "Install Script File..." },
  { label: "Install ScriptUI Panel..." },
  { label: "", sep: true },
  { label: "Change Render Locations.jsx" },
  { label: "Demo Palette.jsx" },
  { label: "Double-Up.jsx" },
  { label: "Find and Replace Text.jsx" },
  { label: "Scale Composition.jsx" },
  { label: "Smart Import.jsx" },
  { label: "Sort Layers by In Point.jsx" },
]);
export const scriptsRowR = (label: string) => SCRIPTS_MENU.rows.find((r) => r.label === label)!.r;

// ---------- macOS open panel ----------
export type FileRow = { name: string; date: string; size: string; kind: string; folder?: boolean; off?: boolean };
export const DLG: Rect = { x: 210, y: 92, w: 580, h: 318 };
const LIST_X = DLG.x + 136;
const LIST_Y = DLG.y + 86;
const ROW_H = 19;
export const dlgRow = (i: number): Rect => ({ x: LIST_X + 4, y: LIST_Y + i * ROW_H, w: DLG.x + DLG.w - LIST_X - 12, h: ROW_H });
export const DLG_OPEN: Rect = { x: DLG.x + DLG.w - 84, y: DLG.y + DLG.h - 34, w: 70, h: 22 };
const DLG_CANCEL: Rect = { x: DLG.x + DLG.w - 164, y: DLG.y + DLG.h - 34, w: 70, h: 22 };

// Pop-in for windows: opens at `from`, closes at `to`
export const winAnim = (f: number, from: number, to: number) => {
  if (f < from || f >= to + 6) return null;
  const o = Math.min(tw(f, from, from + 6, 0, 1), tw(f, to, to + 6, 1, 0));
  const s = f < to ? tw(f, from, from + 9, 0.94, 1, easeOut) : 1;
  return { o, s };
};

export const OpenPanel: React.FC<{
  f: number;
  from: number;
  to: number;
  prompt?: string;
  folder: string;
  files: FileRow[];
  selected: number; // row index, -1 for none
  cursor: Pt;
  down: boolean;
}> = ({ f, from, to, prompt, folder, files, selected, cursor, down }) => {
  const a = winAnim(f, from, to);
  if (!a) return null;
  const openHover = inside(cursor, DLG_OPEN);
  return (
    <div style={{ position: "absolute", inset: 0, opacity: a.o, zIndex: 30 }}>
      <div style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,.25)" }} />
      <div style={{ position: "absolute", inset: 0, transform: `scale(${a.s})`, transformOrigin: `${DLG.x + DLG.w / 2}px ${DLG.y + DLG.h / 2}px` }}>
      <Abs r={DLG} style={{ background: "#282828", border: "1px solid #505050", borderRadius: 11, boxShadow: "0 24px 60px rgba(0,0,0,.6)", overflow: "hidden", fontFamily: FONT, color: "#e6e6e6" }}>
        {/* traffic lights + toolbar */}
        <div style={{ position: "absolute", left: 14, top: 14, display: "flex", gap: 7 }}>
          {["#ff5f57", "#febc2e", "#28c840"].map((c) => (
            <div key={c} style={{ width: 11, height: 11, borderRadius: "50%", background: c }} />
          ))}
        </div>
        <div style={{ position: "absolute", left: 152, top: 10, display: "flex", gap: 10, fontSize: 14, color: "#9a9a9a" }}>
          <span>‹</span>
          <span>›</span>
        </div>
        <div style={{ position: "absolute", left: 194, top: 9, height: 20, padding: "0 10px", borderRadius: 5, background: "#3a3a3a", fontSize: 11.5, lineHeight: "20px" }}>
          {folder} ⌄
        </div>
        <div style={{ position: "absolute", right: 14, top: 9, width: 120, height: 20, borderRadius: 5, background: "#3a3a3a", fontSize: 11, lineHeight: "20px", padding: "0 8px", color: "#8a8a8a", boxSizing: "border-box" }}>⌕ Search</div>
        {/* prompt line, as File.openDialog shows it on macOS */}
        <div style={{ position: "absolute", left: 136, right: 0, top: 38, height: 22, fontSize: 12, fontWeight: 600, lineHeight: "22px", paddingLeft: 12, color: "#f2f2f2", borderBottom: "1px solid #3a3a3a", borderTop: "1px solid #3a3a3a", background: "#2d2d2d" }}>
          {prompt ?? ""}
        </div>
        {/* sidebar */}
        <div style={{ position: "absolute", left: 0, top: 38, width: 136, bottom: 0, background: "#232323", borderRight: "1px solid #3a3a3a", fontSize: 11, padding: "8px 10px", boxSizing: "border-box" }}>
          <div style={{ color: "#8a8a8a", fontSize: 10, fontWeight: 600, marginBottom: 4 }}>Favorites</div>
          {["Desktop", "Documents", "Downloads", "Applications"].map((s) => (
            <div key={s} style={{ lineHeight: "19px", color: "#dcdcdc", display: "flex", gap: 6, alignItems: "center" }}>
              <span style={{ width: 9, height: 8, borderRadius: 2, background: "#3d8bf0", display: "inline-block" }} />
              {s}
            </div>
          ))}
          <div style={{ color: "#8a8a8a", fontSize: 10, fontWeight: 600, margin: "10px 0 4px" }}>Locations</div>
          <div style={{ lineHeight: "19px", color: "#dcdcdc" }}>Macintosh HD</div>
        </div>
        {/* list header */}
        <div style={{ position: "absolute", left: 136, right: 0, top: 62, height: 20, fontSize: 10.5, color: "#9a9a9a", display: "flex", alignItems: "center", padding: "0 16px", borderBottom: "1px solid #3a3a3a" }}>
          <div style={{ flex: 1 }}>Name</div>
          <div style={{ width: 100 }}>Date Modified</div>
          <div style={{ width: 46 }}>Size</div>
          <div style={{ width: 62 }}>Kind</div>
        </div>
        {/* bottom bar */}
        <div style={{ position: "absolute", left: 136, right: 0, bottom: 0, height: 46, borderTop: "1px solid #3a3a3a", background: "#2a2a2a" }} />
      </Abs>
      {files.map((fl, i) => {
        const r = dlgRow(i);
        const sel = i === selected;
        return (
          <Abs key={fl.name} r={r} style={{ borderRadius: 4, background: sel ? C.menuHi : i % 2 ? "transparent" : "#2d2d2d", color: fl.off ? "#6b6b6b" : "#ececec", fontSize: 11.5, display: "flex", alignItems: "center", padding: "0 12px", boxSizing: "border-box" }}>
            <span style={{ width: 11, height: fl.folder ? 9 : 12, marginRight: 7, borderRadius: fl.folder ? "1px 3px 1px 1px" : 1.5, background: fl.folder ? "#5aa0ec" : fl.off ? "#555" : "#d8d8d8", opacity: fl.off ? 0.6 : 1 }} />
            <div style={{ flex: 1, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{fl.name}</div>
            <div style={{ width: 100, color: sel ? "#fff" : "#9a9a9a", fontSize: 10.5 }}>{fl.date}</div>
            <div style={{ width: 46, color: sel ? "#fff" : "#9a9a9a", fontSize: 10.5 }}>{fl.size}</div>
            <div style={{ width: 62, color: sel ? "#fff" : "#9a9a9a", fontSize: 10.5 }}>{fl.kind}</div>
          </Abs>
        );
      })}
      <Abs r={DLG_CANCEL} style={{ borderRadius: 5, background: "#4a4a4a", fontSize: 12, lineHeight: "22px", textAlign: "center" }}>Cancel</Abs>
      <Abs
        r={DLG_OPEN}
        style={{ borderRadius: 5, background: openHover && down ? "#0a4fae" : openHover ? "#2f7ff0" : "#0a63d8", opacity: selected >= 0 ? 1 : 0.45, fontSize: 12, color: "#fff", lineHeight: "22px", textAlign: "center" }}
      >
        Open
      </Abs>
      </div>
    </div>
  );
};

// ---------- ScriptUI report dialog (Window "dialog") ----------
export const REPORT: Rect = { x: 205, y: 96, w: 590, h: 316 };
export const REPORT_CLOSE: Rect = { x: REPORT.x + 16, y: REPORT.y + REPORT.h - 34, w: REPORT.w - 32, h: 22 };

export const ReportDialog: React.FC<{ f: number; from: number; to: number; title: string; lines: string[]; cursor: Pt; down: boolean }> = ({
  f,
  from,
  to,
  title,
  lines,
  cursor,
  down,
}) => {
  const a = winAnim(f, from, to);
  if (!a) return null;
  const hover = inside(cursor, REPORT_CLOSE);
  return (
    <div style={{ position: "absolute", inset: 0, opacity: a.o, zIndex: 30 }}>
      <div style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,.25)" }} />
      <div style={{ position: "absolute", inset: 0, transform: `scale(${a.s})`, transformOrigin: `${REPORT.x + REPORT.w / 2}px ${REPORT.y + REPORT.h / 2}px` }}>
        <Abs r={REPORT} style={{ background: "#2b2b2b", border: "1px solid #505050", borderRadius: 10, boxShadow: "0 24px 60px rgba(0,0,0,.6)", overflow: "hidden" }}>
          <div style={{ height: 28, borderBottom: "1px solid #1f1f1f", background: "#323232", textAlign: "center", fontSize: 12, fontWeight: 600, lineHeight: "28px", color: "#e6e6e6" }}>{title}</div>
          <div style={{ position: "absolute", left: 14, top: 13, display: "flex", gap: 7 }}>
            {["#ff5f57", "#5a5a5a", "#5a5a5a"].map((c, i) => (
              <div key={i} style={{ width: 11, height: 11, borderRadius: "50%", background: c }} />
            ))}
          </div>
          <div
            style={{
              position: "absolute",
              left: 16,
              right: 16,
              top: 42,
              bottom: 46,
              background: "#1c1c1c",
              border: "1px solid #575757",
              borderRadius: 3,
              padding: "6px 8px",
              fontSize: 11,
              lineHeight: "15px",
              color: "#e4e4e4",
              whiteSpace: "pre-wrap",
              overflow: "hidden",
            }}
          >
            {lines.map((l, i) => (
              <div key={i} style={{ opacity: tw(f, from + 4 + i * 2, from + 9 + i * 2, 0, 1) }}>
                {l}
              </div>
            ))}
          </div>
        </Abs>
        <Abs
          r={REPORT_CLOSE}
          style={{ borderRadius: 4, border: `1px solid ${hover && down ? "#5aa6f5" : hover ? "#7a7a7a" : "#555"}`, background: hover && down ? C.blue : hover ? "#474747" : "#333", color: "#fff", fontSize: 11.5, lineHeight: "20px", textAlign: "center", boxSizing: "border-box" }}
        >
          Close
        </Abs>
      </div>
    </div>
  );
};
