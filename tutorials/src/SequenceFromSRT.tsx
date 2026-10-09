import React from "react";
import { AbsoluteFill, useCurrentFrame } from "remotion";
import { camAt, CamKey, center, cursorAt, easeOut, isDown, Move, Pt, tw } from "./ae/anim";
import { DLG_OPEN, dlgRow, FILE_MENU, FileRow, fileRow, Menu, OpenPanel, REPORT_CLOSE, ReportDialog, SCRIPTS_MENU, scriptsRowR } from "./ae/mac";
import { HEAD_Y, TLayer, Timeline, tlX } from "./ae/Timeline";
import { Abs, C, Captions, Cursor, G, KeyChip, MenuBar, menuRects, Panel, ProjectPanel, Ripples, Stage, Toolbar, Viewer } from "./ae/ui";

export const SRT_FRAMES = 660; // 22 s at 30 fps

const DUR = 12;
const ROW_H = 16;
const STRIP_H = 30;
const REST: Pt = { x: 430, y: 175 };

// Cut sheet rows and where their narration is spoken in the SRT
const LINES = [
  "Every morning starts the same way.",
  "You reach for the phone.",
  "One message turns into ten.",
  "The coffee goes cold.",
  "Then you look up.",
  "And the window is bright.",
];
const CUTS = [0, 1.9, 3.7, 5.8, 7.8, 9.9, 12];
const WORDS = LINES.reduce((n, l) => n + l.split(" ").length, 0);

// Frame timing
const F = {
  fileClick: 46,
  runClick: 108,
  dlgA: [114, 178] as [number, number],
  pickScript: 146,
  openA: 174,
  dlg1: [190, 262] as [number, number],
  pickMd: 226,
  open1: 258,
  dlg2: [272, 346] as [number, number],
  pickSrt: 310,
  open2: 342,
  run: 356,
  sweep: [420, 500] as [number, number],
  report: [506, 590] as [number, number],
  close: 584,
  rewind: [606, 640] as [number, number],
};

const mv = (at: number, dur: number, p: Pt): Move => ({ at, dur, x: p.x, y: p.y });
const MOVES: Move[] = [
  mv(20, 24, center(menuRects[0])),
  mv(54, 22, { x: fileRow("Scripts").x + 40, y: fileRow("Scripts").y + 9 }),
  mv(80, 20, { x: scriptsRowR("Run Script File...").x + 60, y: scriptsRowR("Run Script File...").y + 9 }),
  mv(120, 22, { x: dlgRow(1).x + 70, y: dlgRow(1).y + 10 }),
  mv(152, 18, center(DLG_OPEN)),
  mv(200, 22, { x: dlgRow(0).x + 50, y: dlgRow(0).y + 10 }),
  mv(234, 20, center(DLG_OPEN)),
  mv(284, 22, { x: dlgRow(3).x + 55, y: dlgRow(3).y + 10 }),
  mv(318, 20, center(DLG_OPEN)),
  mv(360, 40, { x: 520, y: 250 }),
  mv(540, 30, center(REPORT_CLOSE)),
  mv(600, 40, REST),
];
const CLICKS = [F.fileClick, F.runClick, F.pickScript, F.openA, F.pickMd, F.open1, F.pickSrt, F.open2, F.close];

const STEPS = [
  { from: 10, to: 112, text: "1 · File > Scripts > Run Script File..." },
  { from: 112, to: 188, text: "2 · Pick Lou-Sequence-from-SRT.jsx" },
  { from: 188, to: 272, text: "3 · Select the cut sheet (.md)" },
  { from: 272, to: 356, text: "4 · Select the transcript (.srt)" },
  { from: 356, to: 504, text: "5 · Every frame lands on its spoken line" },
  { from: 504, to: 600, text: "6 · Read the report" },
];

const CAM: CamKey[] = [
  [0, 1, 500, 255], [12, 1, 500, 255],
  [40, 1.45, 250, 150], [104, 1.45, 300, 150],
  [120, 1.25, 500, 250], [342, 1.25, 500, 250],
  [372, 1.3, 420, 400], [416, 1.3, 420, 400],
  [432, 1.15, 400, 300], [500, 1.15, 400, 300],
  [516, 1.25, 500, 254], [590, 1.25, 500, 254],
  [624, 1, 500, 255], [660, 1, 500, 255],
];

const SCRIPT_FILES: FileRow[] = [
  { name: "Lou-Animation-Automation.jsx", date: "Today at 10:02", size: "41 KB", kind: "JSX File" },
  { name: "Lou-Sequence-from-SRT.jsx", date: "Today at 10:02", size: "10 KB", kind: "JSX File" },
  { name: "ReadMe.txt", date: "Today at 10:02", size: "2 KB", kind: "Text", off: true },
];
const demoFiles = (md: boolean): FileRow[] => [
  { name: "cutsheet.md", date: "Today at 09:40", size: "1 KB", kind: "Markdown", off: !md },
  { name: "frames", date: "Today at 09:31", size: "--", kind: "Folder", folder: true },
  { name: "notes.txt", date: "Yesterday", size: "1 KB", kind: "Text" },
  { name: "voiceover.srt", date: "Today at 09:38", size: "2 KB", kind: "SubRip", off: md },
  { name: "voiceover.wav", date: "Today at 09:36", size: "2.1 MB", kind: "Audio", off: true },
];

const SHOT_COLORS = ["#d9825b", "#3d5a8a", "#2f6b5a", "#7a5640", "#5b4a8a", "#d8b45c"];

// Simple flat frames standing in for the image layers
const Shot: React.FC<{ i: number }> = ({ i }) => {
  const bg = SHOT_COLORS[i];
  return (
    <div style={{ position: "absolute", inset: 0, background: bg, overflow: "hidden" }}>
      {i === 0 && (
        <>
          <div style={{ position: "absolute", left: 760, top: 420, width: 400, height: 400, borderRadius: "50%", background: "#f6d27a" }} />
          <div style={{ position: "absolute", left: 0, top: 700, width: 1920, height: 380, background: "#7a3d35" }} />
        </>
      )}
      {i === 1 && <div style={{ position: "absolute", left: 800, top: 170, width: 320, height: 640, borderRadius: 50, background: "#11161f", border: "16px solid #2a2f38" }}><div style={{ position: "absolute", inset: 30, borderRadius: 24, background: "#9fc6ff" }} /></div>}
      {i === 2 &&
        [0, 1, 2, 3].map((k) => (
          <div key={k} style={{ position: "absolute", left: k % 2 ? 860 : 560, top: 170 + k * 190, width: 500, height: 130, borderRadius: 60, background: k % 2 ? "#91C11E" : "#e8efe9" }} />
        ))}
      {i === 3 && (
        <>
          <div style={{ position: "absolute", left: 760, top: 380, width: 360, height: 420, borderRadius: "20px 20px 90px 90px", background: "#efe6da" }} />
          <div style={{ position: "absolute", left: 1090, top: 470, width: 160, height: 200, borderRadius: "50%", border: "40px solid #efe6da", boxSizing: "border-box" }} />
        </>
      )}
      {i === 4 && (
        <>
          <div style={{ position: "absolute", left: 710, top: 240, width: 500, height: 500, borderRadius: "50%", background: "#e8c9a8" }} />
          <div style={{ position: "absolute", left: 850, top: 420, width: 50, height: 70, borderRadius: 25, background: "#2a2230" }} />
          <div style={{ position: "absolute", left: 1020, top: 420, width: 50, height: 70, borderRadius: 25, background: "#2a2230" }} />
        </>
      )}
      {i === 5 && (
        <div style={{ position: "absolute", left: 560, top: 140, width: 800, height: 800, border: "36px solid #6b4a2e", display: "grid", gridTemplateColumns: "1fr 1fr", gap: 36, background: "#6b4a2e", boxSizing: "border-box" }}>
          {[0, 1, 2, 3].map((k) => (
            <div key={k} style={{ background: "#fff6cf" }} />
          ))}
        </div>
      )}
    </div>
  );
};

// Pseudo-random waveform: loud during words, quiet at each cut
const waveAt = (t: number) => {
  const seg = CUTS.findIndex((c, i) => t >= c && t < CUTS[i + 1]);
  const a = CUTS[Math.max(0, seg)];
  const b = CUTS[Math.max(0, seg) + 1] ?? DUR;
  const edge = Math.min(t - a, b - t);
  const env = Math.min(1, edge / 0.18) * (0.55 + 0.45 * Math.abs(Math.sin(t * 7.3)));
  const n = Math.abs(Math.sin(t * 91.7) * Math.cos(t * 37.1));
  return env * (0.35 + 0.65 * n);
};

export const SequenceFromSRT: React.FC = () => {
  const f = useCurrentFrame();
  const cursor = cursorAt(f, REST, MOVES);
  const down = isDown(f, CLICKS);
  const back = 1 - tw(f, F.rewind[0], F.rewind[1], 0, 1);

  // Menus: File opens on click, Scripts submenu opens on hover
  const fileOpen = f >= F.fileClick && f < F.runClick + 2;
  const scriptsOpen = fileOpen && f >= 70;

  // Bars move to their cut, staggered top to bottom; the strip wipes in
  const prog = (i: number) => tw(f, F.run + 4 + i * 6, F.run + 34 + i * 6, 0, 1, easeOut) * back;
  const strip = tw(f, F.run + 8, F.run + 60, 0, 1) * back;
  const stripOn = tw(f, F.run, F.run + 12, 0, 1) * back;
  const rowsTop = HEAD_Y + 16 + STRIP_H * stripOn;

  const t = f < F.sweep[0] ? 0 : f < F.rewind[0] ? tw(f, F.sweep[0], F.sweep[1], 0, DUR - 0.04, (x) => x) : tw(f, F.rewind[0], F.rewind[1], DUR - 0.04, 0);

  const layers: TLayer[] = LINES.map((_, i) => ({
    name: `shot0${i + 1}.png`,
    kind: "img",
    color: "#9a86c9",
    inT: CUTS[i] * prog(i),
    outT: DUR + (CUTS[i + 1] - DUR) * prog(i),
  }));
  const shown = layers.findIndex((l) => t >= l.inT && t < l.outT);

  const report = [
    "Sequence from SRT · comp: Main",
    "Cut sheet rows: 6  |  placed: 6  duplicated: 0  problems: 0  weak matches: 0  (removed 0 repeats)",
    `SRT: ${WORDS} words, ends at ${DUR.toFixed(2)}s`,
    "-------------------------------------------",
    ...LINES.map((l, i) => {
      const k = Math.min(6, l.split(" ").length);
      return `OK  shot0${i + 1}  ${CUTS[i].toFixed(2)} to ${CUTS[i + 1].toFixed(2)}s  [${k}/${k}]`;
    }),
  ];

  const stripY = HEAD_Y + 16;
  const waveBars = Array.from({ length: Math.floor((G.trackX1 - G.trackX0) / 2) }, (_, k) => k * 2);

  return (
    <AbsoluteFill>
      <Stage cam={camAt(f, CAM)}>
        <MenuBar open={fileOpen ? "File" : undefined} />
        <Toolbar />
        <ProjectPanel items={[{ name: "Main", kind: "comp" }, ...LINES.map((_, i) => ({ name: `shot0${i + 1}.png`, kind: "img" as const }))]} />
        <Viewer t={t}>{shown >= 0 && <Shot i={shown} />}</Viewer>
        <Panel r={G.right} tabs={["Info", "Audio", "Effects & Presets"]} active={2}>
          <div style={{ margin: 8, height: 18, borderRadius: 9, background: "#1b1b1b", color: C.dim, fontSize: 10.5, padding: "0 9px", lineHeight: "18px" }}>⌕</div>
          {["* Animation Presets", "3D Channel", "Audio", "Blur & Sharpen", "Channel", "Color Correction", "Distort", "Expression Controls", "Generate", "Immersive Video", "Keying", "Matte", "Noise & Grain", "Obsolete", "Perspective", "Simulation", "Stylize", "Text", "Time", "Transition", "Utility"].map((e) => (
            <div key={e} style={{ fontSize: 11, lineHeight: "19px", padding: "0 12px", color: C.text }}>
              <span style={{ color: C.dim, marginRight: 6 }}>›</span>
              {e}
            </div>
          ))}
        </Panel>
        <Timeline dur={DUR} t={t} layers={layers} rowsTop={rowsTop} rowH={ROW_H}>
          {stripOn > 0 && (
            <div style={{ opacity: stripOn }}>
              <Abs r={{ x: G.timeline.x, y: stripY, w: G.trackX0 - G.timeline.x - 4, h: STRIP_H * stripOn }} style={{ background: "#2a2a2a", borderBottom: "1px solid #1c1c1c", overflow: "hidden" }}>
                <div style={{ position: "absolute", left: 66, top: 4, width: 9, height: 8, background: C.lime, borderRadius: 1 }} />
                <div style={{ position: "absolute", left: 82, top: 1, fontSize: 11, color: C.bright }}>voiceover.srt</div>
                <div style={{ position: "absolute", left: 82, top: 15, fontSize: 9, color: C.dim }}>{WORDS} words · 6 cuts</div>
              </Abs>
              <Abs r={{ x: G.trackX0, y: stripY, w: (G.trackX1 - G.trackX0) * strip, h: STRIP_H * stripOn }} style={{ background: "#1a1f14", overflow: "hidden", borderBottom: "1px solid #1c1c1c" }}>
                <svg width={G.trackX1 - G.trackX0} height={STRIP_H} style={{ position: "absolute", left: 0, top: 0 }}>
                  {waveBars.map((x) => {
                    const h = 2 + waveAt((x / (G.trackX1 - G.trackX0)) * DUR) * 13;
                    return <rect key={x} x={x} y={21 - h / 2} width={1.3} height={h} fill="#6f8f2a" />;
                  })}
                </svg>
                {LINES.map((l, i) => (
                  <div
                    key={l}
                    style={{ position: "absolute", left: tlX(CUTS[i], DUR) - G.trackX0 + 2, top: 1, width: tlX(CUTS[i + 1], DUR) - tlX(CUTS[i], DUR) - 4, fontSize: 8.5, lineHeight: "11px", color: "#e9f5cf", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}
                  >
                    {l}
                  </div>
                ))}
              </Abs>
              {/* cut lines through the strip and the layers */}
              {CUTS.slice(1, -1).map((c, i) => (
                <div key={c} style={{ position: "absolute", left: tlX(c, DUR), top: stripY, width: 1, height: (rowsTop - stripY + ROW_H * 6) * strip, background: C.lime, opacity: 0.55 * tw(strip, (i + 1) / 7, (i + 1) / 7 + 0.1, 0, 1), zIndex: 4 }} />
              ))}
            </div>
          )}
        </Timeline>
        {fileOpen && <Menu m={FILE_MENU} cursor={cursor} forceHi={scriptsOpen ? "Scripts" : undefined} />}
        {scriptsOpen && <Menu m={SCRIPTS_MENU} cursor={cursor} />}
        <OpenPanel f={f} from={F.dlgA[0]} to={F.dlgA[1]} folder="AE Scripts" files={SCRIPT_FILES} selected={f >= F.pickScript ? 1 : -1} cursor={cursor} down={down} />
        <OpenPanel f={f} from={F.dlg1[0]} to={F.dlg1[1]} prompt="1) Select the cut sheet (.md)" folder="SRT Demo" files={demoFiles(true)} selected={f >= F.pickMd ? 0 : -1} cursor={cursor} down={down} />
        <OpenPanel f={f} from={F.dlg2[0]} to={F.dlg2[1]} prompt="2) Select the transcript (.srt)" folder="SRT Demo" files={demoFiles(false)} selected={f >= F.pickSrt ? 3 : -1} cursor={cursor} down={down} />
        <ReportDialog f={f} from={F.report[0]} to={F.report[1]} title="Sequence from SRT" lines={report} cursor={cursor} down={down} />
        <KeyChip f={f} from={F.rewind[0] - 6} to={F.rewind[1]} label="⌘ Z" p={cursor} />
        <Ripples f={f} clicks={CLICKS.map((c) => ({ f: c, p: cursorAt(c, REST, MOVES) }))} />
        <Cursor p={cursor} down={down} />
      </Stage>
      <Captions f={f} steps={STEPS} />
    </AbsoluteFill>
  );
};
