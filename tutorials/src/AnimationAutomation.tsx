import React from "react";
import { AbsoluteFill, useCurrentFrame } from "remotion";
import { aeEase, camAt, CamKey, center, cursorAt, easeOut, isDown, Move, Pt, tw } from "./ae/anim";
import { AAPanel, btn } from "./ae/aaPanel";
import { HEAD_Y, TLayer, Timeline, tlX } from "./ae/Timeline";
import { Captions, Cursor, G, KeyChip, MenuBar, ProjectPanel, Ripples, Stage, Toolbar, Viewer } from "./ae/ui";

export const AA_FRAMES = 750; // 25 s at 30 fps

const DUR = 10; // comp length in the timeline (s)
const ROWS_TOP = HEAD_Y + 16;
const ROW_H = 18;
const LEN = 3; // each layer is 3 s long
const REST: Pt = { x: 430, y: 175 };
const rowName = (i: number): Pt => ({ x: 132, y: ROWS_TOP + i * ROW_H + 9 });
const TRIM_TO = 8;
const IO = 1; // In/Out (s) field of the panel, set to 1 s

const mv = (at: number, dur: number, p: Pt): Move => ({ at, dur, x: p.x, y: p.y });
const MOVES: Move[] = [
  mv(15, 22, rowName(0)),
  mv(48, 18, rowName(2)),
  mv(86, 26, center(btn("in.L"))),
  mv(214, 24, center(btn("elastic"))),
  mv(358, 26, center(btn("seq"))),
  mv(440, 24, rowName(2)),
  mv(476, 26, center(btn("out.R"))),
  mv(514, 26, { x: tlX(2 * LEN + LEN, DUR) - 1, y: ROWS_TOP + 2 * ROW_H + 9 }),
  mv(548, 30, { x: tlX(TRIM_TO, DUR) - 1, y: ROWS_TOP + 2 * ROW_H + 9 }),
  mv(670, 40, REST),
];
const CLICKS = [40, 70, 116, 240, 388, 468, 506];
const DRAG: [number, number] = [544, 582];
const UNDO_SLIDE = 206; // first ⌘Z removes the slide before trying the elastic scale
const REWIND: [number, number] = [676, 714];

const STEPS = [
  { from: 10, to: 100, text: "1 · Select layers" },
  { from: 100, to: 356, text: "2 · Choose an animation" },
  { from: 356, to: 450, text: "3 · Sequence" },
  { from: 450, to: 668, text: "4 · Trim it, the animation adapts" },
];

// Screen-recording style zoom: close on the control being used, wider while the comp plays
const TL: [number, number] = [300, 390];
const PANEL = (y: number): [number, number] => [830, y];
const PLAY: [number, number] = [470, 270];
const CAM: CamKey[] = [
  [0, 1, 500, 255], [14, 1, 500, 255],
  [34, 1.4, ...TL], [78, 1.4, ...TL],
  [102, 1.4, ...PANEL(190)], [120, 1.4, ...PANEL(190)],
  [138, 1.2, ...PLAY], [192, 1.2, ...PLAY],
  [210, 1.4, ...PANEL(212)], [246, 1.4, ...PANEL(212)],
  [266, 1.25, ...PLAY], [348, 1.25, ...PLAY],
  [364, 1.4, ...PANEL(380)], [392, 1.4, ...PANEL(380)],
  [412, 1.35, 430, 400], [466, 1.35, 430, 400],
  [486, 1.4, ...PANEL(212)], [508, 1.4, ...PANEL(212)],
  [530, 1.35, 450, 400], [584, 1.35, 450, 400],
  [604, 1.2, 440, 285], [664, 1.2, 440, 285],
  [700, 1, 500, 255], [750, 1, 500, 255],
];

// Playhead (comp seconds) for each video frame
const lin = (x: number) => x;
const playhead = (f: number) => {
  if (f < 124) return 0;
  if (f < 268) return tw(f, 124, 188, 0, 1.6, lin);
  // Elastic preview at half speed so the overshoot reads
  if (f < 590) return tw(f, 268, 346, 0, 1.3, lin);
  if (f < REWIND[0]) return tw(f, 592, 668, 6, 8.4, lin);
  return tw(f, REWIND[0], REWIND[1], 8.4, 0);
};

// After Effects easeOutElastic, as in the script's Elastic Scale In expression
const elastic = (x: number) => (x <= 0 ? 0 : x >= 1 ? 1 : Math.pow(2, -10 * x) * Math.sin((x * 10 - 0.75) * ((2 * Math.PI) / 3)) + 1);

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
    if (f < 468) return true;
    return i === 2;
  };

  // Applied expressions, faded out by the undo at the end
  const slideW = f >= 118 && f < UNDO_SLIDE ? 1 : 0;
  const elasticW = (f >= 242 ? 1 : 0) * back;
  const exitW = (f >= 508 ? 1 : 0) * back; // Exit Right on Photo.jpg only

  // Sequence: Square moves to 3 s and Photo to 6 s, staggered
  const seqStart = [0, tw(f, 392, 424, 0, LEN, easeOut) * back, tw(f, 398, 434, 0, 2 * LEN, easeOut) * back];
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
    const life = ly.outT - ly.inT;
    const d = Math.min(IO, life);
    // Entrance ← Left: slides in from one comp width to the left
    const slideIn = ti < d ? -1920 * (1 - aeEase(ti / d)) : 0;
    // Exit Right →: slides out over the last IO seconds before the out point
    const t0 = ly.outT - d;
    const slideOut = i === 2 && t > t0 ? 1920 * aeEase((t - t0) / d) * exitW : 0;
    // Elastic Scale In: 0 to 100% with overshoot
    const s = 1 + (elastic(ti / d) - 1) * elasticW;
    return { dx: slideIn * slideW + slideOut, s };
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
          {L1 && <div style={{ position: "absolute", left: 440 + L1.dx, top: 600, width: 240, height: 240, background: "#91C11E", transform: `scale(${L1.s})` }} />}
          {L2 && (
            <div style={{ position: "absolute", left: 1140 + L2.dx, top: 575, width: 440, height: 290, background: "#5d6470", overflow: "hidden", transform: `scale(${L2.s})` }}>
              <div style={{ position: "absolute", left: 300, top: 50, width: 70, height: 70, borderRadius: "50%", background: "#d9c27a" }} />
              <svg width="440" height="290" style={{ position: "absolute", left: 0, top: 0 }}>
                <path d="M0 290 L140 120 L230 220 L300 160 L440 290 Z" fill="#3c424c" />
              </svg>
            </div>
          )}
          {L0 && (
            <div style={{ position: "absolute", left: 0, top: 210, width: 1920, textAlign: "center", fontSize: 220, fontWeight: 800, color: "#fff", letterSpacing: -4, transform: `translateX(${L0.dx}px) scale(${L0.s})`, transformOrigin: "960px 130px" }}>
              Hello
            </div>
          )}
        </Viewer>
        <AAPanel cursor={cursor} down={down} />
        <Timeline dur={DUR} t={t} layers={layers} rowsTop={ROWS_TOP} rowH={ROW_H} />
        <KeyChip f={f} from={56} to={84} label="⇧ Shift" p={cursor} />
        <KeyChip f={f} from={194} to={222} label="⌘ Z" p={cursor} />
        <KeyChip f={f} from={668} to={714} label="⌘ Z" p={cursor} />
        <Ripples f={f} clicks={[...CLICKS, DRAG[0]].map((c) => ({ f: c, p: cursorAt(c, REST, MOVES) }))} />
        <Cursor p={cursor} down={down} />
      </Stage>
      <Captions f={f} steps={STEPS} />
    </AbsoluteFill>
  );
};
