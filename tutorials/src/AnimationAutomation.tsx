import React from "react";
import { AbsoluteFill, useCurrentFrame } from "remotion";
import { aeEase, camAt, CamKey, center, cursorAt, easeOut, isDown, Move, Pt, tw } from "./ae/anim";
import { AAPanel, btn } from "./ae/aaPanel";
import { HEAD_Y, TLayer, Timeline, tlX } from "./ae/Timeline";
import { Captions, Cursor, G, KeyChip, MenuBar, ProjectPanel, Ripples, Stage, Toolbar, Viewer } from "./ae/ui";

export const AA_FRAMES = 720; // 24 s at 30 fps

const DUR = 10; // comp length in the timeline (s)
const ROWS_TOP = HEAD_Y + 16;
const ROW_H = 18;
const LEN = 3; // each layer is 3 s long
const REST: Pt = { x: 430, y: 175 };
const rowName = (i: number): Pt => ({ x: 132, y: ROWS_TOP + i * ROW_H + 9 });
const TRIM_TO = 7.5;

const mv = (at: number, dur: number, p: Pt): Move => ({ at, dur, x: p.x, y: p.y });
const MOVES: Move[] = [
  mv(15, 22, rowName(0)),
  mv(48, 18, rowName(2)),
  mv(86, 26, center(btn("in.L"))),
  mv(194, 22, rowName(0)),
  mv(226, 24, center(btn("elastic"))),
  mv(324, 24, center(btn("fadeBoth"))),
  mv(414, 24, center(btn("seq"))),
  mv(496, 24, { x: tlX(6 + LEN, DUR) - 1, y: ROWS_TOP + 2 * ROW_H + 9 }),
  mv(528, 30, { x: tlX(TRIM_TO, DUR) - 1, y: ROWS_TOP + 2 * ROW_H + 9 }),
  mv(650, 40, REST),
];
const CLICKS = [40, 70, 116, 220, 254, 352, 442];
const DRAG: [number, number] = [524, 562];
const REWIND: [number, number] = [656, 694];

const STEPS = [
  { from: 10, to: 100, text: "1 · Select layers" },
  { from: 100, to: 192, text: "2 · Slide in from the left, no keyframes" },
  { from: 192, to: 318, text: "3 · Elastic Scale In" },
  { from: 318, to: 410, text: "4 · Fade In+Out" },
  { from: 410, to: 492, text: "5 · Sequence the layers" },
  { from: 492, to: 648, text: "6 · Trim it, the animation adapts" },
];

// Screen-recording style zoom: close on the control being used, wider while the comp plays
const TL: [number, number] = [300, 390];
const PANEL = (y: number): [number, number] => [830, y];
const PLAY: [number, number] = [470, 270];
const CAM: CamKey[] = [
  [0, 1, 500, 255], [14, 1, 500, 255],
  [34, 1.4, ...TL], [78, 1.4, ...TL],
  [102, 1.4, ...PANEL(190)], [120, 1.4, ...PANEL(190)],
  [138, 1.2, ...PLAY], [188, 1.2, ...PLAY],
  [208, 1.4, ...TL], [222, 1.4, ...TL],
  [242, 1.4, ...PANEL(230)], [258, 1.4, ...PANEL(230)],
  [272, 1.2, ...PLAY], [316, 1.2, ...PLAY],
  [334, 1.4, ...PANEL(250)], [356, 1.4, ...PANEL(250)],
  [370, 1.2, ...PLAY], [406, 1.2, ...PLAY],
  [426, 1.4, ...PANEL(380)], [444, 1.4, ...PANEL(380)],
  [462, 1.35, 430, 400], [530, 1.35, 450, 400],
  [570, 1.2, 440, 285], [640, 1.2, 440, 285],
  [676, 1, 500, 255], [720, 1, 500, 255],
];

// Playhead (comp seconds) for each video frame
const playhead = (f: number) => {
  if (f < 124) return 0;
  if (f < 262) return tw(f, 124, 188, 0, 1.6, (x) => x);
  if (f < 360) return tw(f, 262, 316, 0, 1.4, (x) => x);
  if (f < 568) return tw(f, 360, 408, 0, 1.2, (x) => x);
  if (f < REWIND[0]) return tw(f, 568, 642, 6, 8, (x) => x);
  return tw(f, REWIND[0], REWIND[1], 8, 0);
};

const LAYERS = [
  { name: "Hello", kind: "text" as const, color: "#c0504d" },
  { name: "Square", kind: "shape" as const, color: "#4a72c4" },
  { name: "Photo.jpg", kind: "img" as const, color: "#9a86c9" },
];

export const AnimationAutomation: React.FC = () => {
  const f = useCurrentFrame();
  const cursor = cursorAt(f, REST, MOVES);
  const down = isDown(f, CLICKS, [DRAG]);
  const back = 1 - tw(f, REWIND[0], REWIND[1], 0, 1); // 1 while built, 0 after undo

  // Which layers are selected
  const sel = (i: number) => {
    if (f < 40 || f >= REWIND[0]) return false;
    if (f < 70) return i === 0;
    if (f < 220) return true;
    if (f < 328) return i === 0;
    if (f < DRAG[0]) return true;
    return i === 2;
  };

  // Applied expressions, faded out by the undo at the end
  const slideW = (f >= 118 ? 1 : 0) * back;
  const elasticW = (f >= 256 ? 1 : 0) * back;
  const fadeW = (f >= 354 ? 1 : 0) * back;

  // Sequence: Square moves to 3 s and Photo to 6 s, staggered
  const seqStart = [0, tw(f, 446, 478, 0, LEN, easeOut) * back, tw(f, 452, 488, 0, 2 * LEN, easeOut) * back];
  // Trim: Photo's out point follows the cursor while dragging
  let photoLen = LEN;
  if (f >= DRAG[0]) {
    const dragT = ((cursor.x + 1 - G.trackX0) / (G.trackX1 - G.trackX0)) * DUR - seqStart[2];
    photoLen = f < DRAG[1] ? dragT : TRIM_TO - 2 * LEN;
    photoLen = LEN + (photoLen - LEN) * back;
  }
  const lens = [LEN, LEN, photoLen];

  const t = playhead(f);
  const layers: TLayer[] = LAYERS.map((l, i) => ({ ...l, inT: seqStart[i], outT: seqStart[i] + lens[i], selected: sel(i) }));

  // Comp render at time t, following the script's expressions
  const look = (i: number) => {
    const ly = layers[i];
    if (t < ly.inT - 1e-6 || t >= ly.outT) return null;
    const ti = t - ly.inT;
    const slide = ti < 0.5 ? -1920 * (1 - aeEase(ti / 0.5)) : 0;
    let s = 1;
    if (i === 0) {
      const x = Math.min(1, ti / 0.5);
      const e = ti <= 0 ? 0 : x >= 1 ? 1 : Math.pow(2, -10 * x) * Math.sin((x * 10 - 0.75) * ((2 * Math.PI) / 3)) + 1;
      s = 1 + (e - 1) * elasticW;
    }
    const d = 10 / 30;
    const oi = ti < d ? ti / d : 1;
    const oo = ly.outT - t < d ? (ly.outT - t) / d : 1;
    return { dx: slide * slideW, s, o: 1 + (Math.min(oi, oo) - 1) * fadeW };
  };
  const L0 = look(0);
  const L1 = look(1);
  const L2 = look(2);

  return (
    <AbsoluteFill>
      <Stage cam={camAt(f, CAM)}>
        <MenuBar />
        <Toolbar />
        <ProjectPanel items={[{ name: "Main", kind: "comp" }, { name: "Photo.jpg", kind: "img" }, { name: "Solids", kind: "folder" }]} />
        <Viewer t={t}>
          {L1 && <div style={{ position: "absolute", left: 440 + L1.dx, top: 600, width: 240, height: 240, background: "#91C11E", opacity: L1.o }} />}
          {L2 && (
            <div style={{ position: "absolute", left: 1140 + L2.dx, top: 575, width: 440, height: 290, background: "#5d6470", opacity: L2.o, overflow: "hidden" }}>
              <div style={{ position: "absolute", left: 300, top: 50, width: 70, height: 70, borderRadius: "50%", background: "#d9c27a" }} />
              <svg width="440" height="290" style={{ position: "absolute", left: 0, top: 0 }}>
                <path d="M0 290 L140 120 L230 220 L300 160 L440 290 Z" fill="#3c424c" />
              </svg>
            </div>
          )}
          {L0 && (
            <div style={{ position: "absolute", left: 0, top: 210, width: 1920, textAlign: "center", fontSize: 220, fontWeight: 800, color: "#fff", letterSpacing: -4, transform: `translateX(${L0.dx}px) scale(${L0.s})`, transformOrigin: "960px 120px", opacity: L0.o }}>
              Hello
            </div>
          )}
        </Viewer>
        <AAPanel cursor={cursor} down={down} />
        <Timeline dur={DUR} t={t} layers={layers} rowsTop={ROWS_TOP} rowH={ROW_H} />
        <KeyChip f={f} from={56} to={84} label="⇧ Shift" p={cursor} />
        <KeyChip f={f} from={318} to={346} label="⌘ A" p={cursor} />
        <KeyChip f={f} from={648} to={694} label="⌘ Z" p={cursor} />
        <Ripples f={f} clicks={[...CLICKS, DRAG[0]].map((c) => ({ f: c, p: cursorAt(c, REST, MOVES) }))} />
        <Cursor p={cursor} down={down} />
      </Stage>
      <Captions f={f} steps={STEPS} />
    </AbsoluteFill>
  );
};
