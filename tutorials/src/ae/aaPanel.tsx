import React from "react";
import { Pt, Rect, textW } from "./anim";
import { G, Panel, SButton, SField, SGroup, SLabel } from "./ui";

// Layout of the "Lou - Animation Automation" ScriptUI panel, in the same order
// and with the same English labels as public/scripts/Lou-Animation-Automation.jsx
type Btn = { id: string; label: string; r: Rect };
type Fld = { r: Rect; text: string };
type Lbl = { x: number; y: number; h: number; text: string };
type Grp = { r: Rect; title: string };

const X0 = G.right.x + 12;
const W = G.right.w - 24;
const ROW = 18;
const GAP = 4;

const row = (y: number, x: number, w: number, items: { id: string; label: string }[]): Btn[] => {
  const nat = items.map((it) => textW(it.label) + 16);
  const extra = (w - nat.reduce((a, b) => a + b, 0) - GAP * (items.length - 1)) / items.length;
  let cx = x;
  return items.map((it, i) => {
    const bw = nat[i] + extra;
    const b = { id: it.id, label: it.label, r: { x: cx, y, w: bw, h: ROW } };
    cx += bw + GAP;
    return b;
  });
};

export const aaLayout = () => {
  const buttons: Btn[] = [];
  const fields: Fld[] = [];
  const labels: Lbl[] = [];
  const groups: Grp[] = [];
  let y = G.right.y + 18 + 10;

  // In/Out (s): [0.5]  Scale %: [20]  Fade (frames): [10]
  let x = X0;
  for (const [lab, val] of [["In/Out (s):", "0.5"], ["Scale %:", "20"], ["Fade (frames):", "10"]]) {
    labels.push({ x, y, h: ROW, text: lab });
    x += textW(lab) + 5;
    fields.push({ r: { x, y, w: 30, h: ROW }, text: val });
    x += 30 + 10;
  }
  y += ROW + 8;

  const group = (title: string, rows: (gy: number, ix: number, iw: number) => number) => {
    const ix = X0 + 8;
    const iw = W - 16;
    const h = rows(y + 15, ix, iw) - y + 7;
    groups.push({ r: { x: X0, y, w: W, h }, title });
    y += h + 6;
  };
  const btnRow = (items: { id: string; label: string }[]) => (gy: number, ix: number, iw: number) => {
    buttons.push(...row(gy, ix, iw, items));
    return gy + ROW;
  };

  group("Entrances (slide into place)", btnRow([
    { id: "in.L", label: "← Left" }, { id: "in.R", label: "Right →" }, { id: "in.T", label: "↑ Up" }, { id: "in.B", label: "↓ Down" },
  ]));
  group("Exits (slide out)", btnRow([
    { id: "out.L", label: "← Left" }, { id: "out.R", label: "Right →" }, { id: "out.T", label: "↑ Up" }, { id: "out.B", label: "↓ Down" },
  ]));
  group("Scale", btnRow([
    { id: "elastic", label: "Elastic Scale In" }, { id: "grow", label: "Grow X%" }, { id: "shrink", label: "Shrink X%" },
  ]));
  group("Opacity", btnRow([
    { id: "fadeIn", label: "Fade In" }, { id: "fadeOut", label: "Fade Out" }, { id: "fadeBoth", label: "Fade In+Out" },
  ]));
  group("Sequence from SRT (paste a path or click …)", (gy, ix, iw) => {
    for (const [lab, id] of [["MD :", "srt.md"], ["SRT:", "srt.srt"]]) {
      labels.push({ x: ix, y: gy, h: ROW, text: lab });
      fields.push({ r: { x: ix + 28, y: gy, w: iw - 28 - 28, h: ROW }, text: "" });
      buttons.push({ id, label: "…", r: { x: ix + iw - 24, y: gy, w: 24, h: ROW } });
      gy += ROW + 5;
    }
    buttons.push({ id: "srt.run", label: "Sequence from SRT", r: { x: ix, y: gy, w: iw, h: ROW } });
    return gy + ROW;
  });
  group("Organize", btnRow([
    { id: "seq", label: "Sequence" }, { id: "precomp", label: "Precompose Selection" }, { id: "reverse", label: "Reverse Order" },
  ]));
  group("Random (1 move per layer)", (gy, ix, iw) => {
    let fx = ix;
    for (const [lab, val] of [["Move %:", "10"], ["Zoom %:", "8"]]) {
      labels.push({ x: fx, y: gy, h: ROW, text: lab });
      fx += textW(lab) + 5;
      fields.push({ r: { x: fx, y: gy, w: 30, h: ROW }, text: val });
      fx += 40;
    }
    buttons.push({ id: "random", label: "Randomize Moves", r: { x: ix, y: gy + ROW + 5, w: iw, h: ROW } });
    return gy + ROW * 2 + 5;
  });
  buttons.push(...row(y, X0, W, [{ id: "clear", label: "Clear Animation" }, { id: "copy", label: "Copy Frame to Clipboard" }]));

  return { buttons, fields, labels, groups };
};

export const AA = aaLayout();
export const btn = (id: string) => AA.buttons.find((b) => b.id === id)!.r;

export const AAPanel: React.FC<{ cursor: Pt; down: boolean }> = ({ cursor, down }) => (
  <>
    <Panel r={G.right} tabs={["Lou-Animation-Automation.jsx", "Info"]} />
    {AA.groups.map((g) => (
      <SGroup key={g.title} r={g.r} title={g.title} />
    ))}
    {AA.labels.map((l, i) => (
      <SLabel key={i} {...l} />
    ))}
    {AA.fields.map((fl, i) => (
      <SField key={i} r={fl.r} text={fl.text} />
    ))}
    {AA.buttons.map((b) => (
      <SButton key={b.id} r={b.r} label={b.label} cursor={cursor} down={down} />
    ))}
  </>
);
