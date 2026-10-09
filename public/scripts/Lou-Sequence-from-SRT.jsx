/**
 * Lou - Sequence from SRT
 * Times the image layers in the active comp to a voiceover. It reads a
 * transcript (.srt, for example exported from Premiere Pro) and a cut sheet
 * (.md) that maps each frame to its line of narration. Every row's narration
 * is matched to the SRT to find when it is spoken, and the matching layer
 * then runs from that moment until the next row starts, with no gaps.
 * Frames that are reused get duplicated, and rows that list several frames
 * split their window equally. Safe to run again on the same comp.
 *
 * Cut sheet format: a markdown table with a column whose header starts with
 * FRAME and one whose header starts with NARR (NARRATION, or the Portuguese
 * NARRAÇÃO). The FRAME cell holds layer names such as shot01 or shot02.png,
 * separated by "/" or "," when one line uses several frames. A narration that
 * starts with "(" is treated as a note and shares the previous line's window.
 *
 * Install
 *   This is a run-once script, not a dockable panel.
 *   1. In After Effects choose File > Scripts > Run Script File and pick this
 *      file, or copy it into the "Scripts" folder of your After Effects
 *      installation and restart, then run it from File > Scripts.
 *   2. Open the target comp first, then pick the cut sheet and the SRT.
 *   A report is shown at the end and saved to your desktop as
 *   Sequence-from-SRT-log.txt.
 *   The same feature is also built into the Lou - Animation Automation panel.
 *
 * Tested on After Effects 2024 and later.
 * Author:  Lou Gastardi, https://lougastardi.github.io/portfolio/
 * License: MIT
 */
(function () {
    var comp = app.project.activeItem;
    if (!(comp instanceof CompItem)) { alert("Open or select the target comp (the one with the frame layers)."); return; }

    var mdFile = File.openDialog("1) Select the cut sheet (.md)", "*.md;*.txt;*.markdown");
    if (!mdFile) return;
    var srtFile = File.openDialog("2) Select the transcript (.srt)", "*.srt;*.txt;*.vtt");
    if (!srtFile) return;
    mdFile.open("r"); var mdRaw = mdFile.read(); mdFile.close();
    srtFile.open("r"); srtFile.encoding = "UTF-8"; srtFile.close();
    srtFile.open("r"); srtFile.encoding = "UTF-8"; var srtRaw = srtFile.read(); srtFile.close();

    // ---------- helpers ----------
    function trim(s) { return String(s).replace(/^\s+|\s+$/g, ""); }
    function normW(s) { return String(s).toLowerCase().replace(/[^a-z0-9]/g, ""); }
    function frameNum(s) { var m = String(s).match(/(\d+)/); return m ? parseInt(m[1], 10) : null; }
    function splitWords(s) {
        var r = String(s).split(/\s+/), o = [];
        for (var i = 0; i < r.length; i++) { var n = normW(r[i]); if (n !== "") o.push(n); }
        return o;
    }

    // ---------- parse SRT -> word stream w/ interpolated times ----------
    function parseSRT(txt) {
        var blocks = txt.split(/\r?\n\r?\n/), words = [], srtEnd = 0;
        for (var bi = 0; bi < blocks.length; bi++) {
            var rawl = blocks[bi].split(/\r?\n/), lines = [];
            for (var i = 0; i < rawl.length; i++) if (trim(rawl[i]) !== "") lines.push(rawl[i]);
            if (lines.length < 2) continue;
            var tcIdx = -1;
            for (var j = 0; j < lines.length; j++) if (lines[j].indexOf("-->") !== -1) { tcIdx = j; break; }
            if (tcIdx === -1) continue;
            var m = lines[tcIdx].match(/(\d+):(\d+):(\d+)[,.](\d+)\s*-->\s*(\d+):(\d+):(\d+)[,.](\d+)/);
            if (!m) continue;
            var s = (+m[1]) * 3600 + (+m[2]) * 60 + (+m[3]) + (+m[4]) / 1000;
            var e = (+m[5]) * 3600 + (+m[6]) * 60 + (+m[7]) + (+m[8]) / 1000;
            if (e > srtEnd) srtEnd = e;
            var parts = [];
            for (var k = tcIdx + 1; k < lines.length; k++) parts.push(lines[k]);
            var toks = splitWords(parts.join(" "));
            for (var w = 0; w < toks.length; w++) {
                var t = s + (toks.length > 1 ? (e - s) * (w / toks.length) : 0);
                words.push({ w: toks[w], t: t });
            }
        }
        return { words: words, end: srtEnd };
    }

    // ---------- parse MD -> rows {frame, narr} (columns by header) ----------
    // Headers are matched by prefix, so FRAME/FRAMES and NARRATION/NARRAÇÃO
    // are all accepted.
    function parseMD(txt) {
        var lines = txt.split(/\r?\n/), frameCol = -1, narrCol = -1, rows = [];
        for (var i = 0; i < lines.length; i++) {
            var ln = trim(lines[i]);
            if (ln.indexOf("|") === -1) continue;
            if (/^\|?\s*-{2,}/.test(ln)) continue;
            var cells = ln.split("|"), c = [];
            for (var j = 0; j < cells.length; j++) c.push(trim(cells[j]));
            while (c.length && c[0] === "") c.shift();
            while (c.length && c[c.length - 1] === "") c.pop();
            if (!c.length) continue;
            if (frameCol === -1) {
                var fc = -1, nc = -1;
                for (var a = 0; a < c.length; a++) {
                    var lc = c[a].toLowerCase();
                    if (fc === -1 && /^frame/.test(lc)) fc = a;
                    if (nc === -1 && /^narr/.test(lc)) nc = a;
                }
                if (fc !== -1 && nc !== -1 && fc !== nc) { frameCol = fc; narrCol = nc; }
                continue;
            }
            if (c.length <= (frameCol > narrCol ? frameCol : narrCol)) continue;
            var frame = c[frameCol], narr = c[narrCol];
            if (!frame) continue;  // any non-empty token (frame/shot/etc.)
            rows.push({ frame: frame, narr: narr });
        }
        return rows;
    }

    // ---------- fuzzy monotonic anchor match ----------
    function matchStart(words, rw, lastPos) {
        var K = rw.length < 6 ? rw.length : 6, best = -1, bestScore = -1;
        var limit = words.length, cap = lastPos + 400; if (cap < limit) limit = cap;
        for (var p = lastPos; p < limit; p++) {
            var score = 0;
            for (var i = 0; i < K && (p + i) < words.length; i++) if (words[p + i].w === rw[i]) score++;
            if (score > bestScore) { bestScore = score; best = p; if (score === K) break; }
        }
        return { pos: best, score: bestScore, k: K };
    }

    // ---------- layer helpers ----------
    function stripExt(s) { return String(s).replace(/\.[a-z0-9]{1,5}$/i, ""); }
    function normName(s) { return normW(stripExt(s)); }  // "shot02.png" -> "shot02"
    function findLayer(token) {
        var nt = normName(token); if (nt === "") return null;
        for (var i = 1; i <= comp.numLayers; i++) {
            if (normName(comp.layer(i).name) === nt) return comp.layer(i);
        }
        return null;
    }
    function place(L, tin, tout) {
        var still = false;
        try { still = (L.source.duration === 0); } catch (e) {}
        if (!still) L.startTime = tin;
        if (tout > L.outPoint) { L.outPoint = tout; L.inPoint = tin; }
        else { L.inPoint = tin; L.outPoint = tout; }
    }

    // ---------- run ----------
    var srt = parseSRT(srtRaw);
    var words = srt.words, END = srt.end;
    var rows = parseMD(mdRaw);
    if (words.length === 0) { alert("The SRT has no readable subtitles."); return; }
    if (rows.length === 0) { alert("No table found in the cut sheet. It needs a FRAME column and a NARRATION column."); return; }

    // Build segments. A row whose narration starts with "(" is a NOTE/b-roll
    // line. It is not spoken, so it does NOT anchor to the SRT. It attaches to
    // the previous spoken segment and shares its window.
    var segs = [], lastPos = 0;   // seg = { start, rows:[idx], score }
    for (var r = 0; r < rows.length; r++) {
        if (/^\s*\(/.test(rows[r].narr)) {
            if (segs.length === 0) segs.push({ start: 0, rows: [], score: "note" });
            segs[segs.length - 1].rows.push(r);
            continue;
        }
        var rw = splitWords(rows[r].narr);
        var mm = matchStart(words, rw, lastPos);
        var st = (mm.pos >= 0) ? words[mm.pos].t : (segs.length ? segs[segs.length - 1].start : 0);
        if (mm.pos >= 0 && mm.pos + 1 > lastPos) lastPos = mm.pos + 1;
        segs.push({ start: st, rows: [r], score: mm.score + "/" + mm.k });
    }

    var log = [], done = 0, miss = 0, dups = 0, low = 0, used = {};

    // set of tokens referenced by the MD (only these layers are touched)
    var tokenSet = {};
    for (var ti = 0; ti < rows.length; ti++) {
        var tparts = rows[ti].frame.split(/\s*[\/,]\s*/);
        for (var tj = 0; tj < tparts.length; tj++) { var nn = normName(tparts[tj]); if (nn !== "") tokenSet[nn] = true; }
    }

    app.beginUndoGroup("Lou: Sequence from SRT");
    // collapse pre-existing duplicate sequence layers -> one each (re-runnable)
    var seen = {}, removed = 0;
    for (var dd = comp.numLayers; dd >= 1; dd--) {
        var Ld = comp.layer(dd);
        var nm = normName(Ld.name);
        if (!tokenSet[nm]) continue;   // only MD-referenced layers
        if (seen[nm]) { try { Ld.remove(); removed++; } catch (e) {} }
        else seen[nm] = true;
    }

    for (var si = 0; si < segs.length; si++) {
        var s = segs[si].start;
        var e2 = (si + 1 < segs.length) ? segs[si + 1].start : END;
        if (e2 <= s) e2 = s + 0.5; // safety
        var scLow = (segs[si].score !== "note" && parseInt(segs[si].score, 10) < 2); if (scLow) low++;
        var toks = [];
        for (var rr = 0; rr < segs[si].rows.length; rr++) {
            var rawNames = rows[segs[si].rows[rr]].frame.split(/\s*[\/,]\s*/);
            for (var q = 0; q < rawNames.length; q++) { var tk = trim(rawNames[q]); if (tk !== "") toks.push(tk); }
        }
        var seg = (e2 - s) / (toks.length || 1);
        for (var n = 0; n < toks.length; n++) {
            var token = toks[n], a = s + seg * n, b = s + seg * (n + 1);
            var L = findLayer(token);
            if (!L) { log.push("NOT FOUND '" + token + "' (seg " + (si + 1) + ", " + segs[si].score + ")"); miss++; continue; }
            var key = normName(token), isDup = false;
            if (used[key]) { try { L = L.duplicate(); isDup = true; dups++; } catch (e) {} }
            used[key] = true;
            try {
                place(L, a, b);
                log.push("OK  " + token + (isDup ? " (dup)" : "") + "  " + a.toFixed(2) + " to " + b.toFixed(2) + "s  [" + segs[si].score + (scLow ? " ⚠" : "") + "]");
                done++;
            } catch (e) { log.push("ERROR " + token + ": " + e.toString()); miss++; }
        }
    }

    // Restack by time: top = earliest, descending = later (staircase timeline).
    var fl = [];
    for (var fi = 1; fi <= comp.numLayers; fi++) { var FL = comp.layer(fi); if (tokenSet[normName(FL.name)]) fl.push(FL); }
    fl.sort(function (x, y) { return x.inPoint - y.inPoint; });
    for (var so = fl.length - 1; so >= 0; so--) { try { fl[so].moveToBeginning(); } catch (e) {} }

    app.endUndoGroup();

    var txt = "Sequence from SRT · comp: " + comp.name +
              "\nCut sheet rows: " + rows.length + "  |  placed: " + done + "  duplicated: " + dups +
              "  problems: " + miss + "  weak matches: " + low + "  (removed " + removed + " repeats)" +
              "\nSRT: " + words.length + " words, ends at " + END.toFixed(2) + "s" +
              "\n-------------------------------------------\n" + log.join("\n");
    try { var lf = new File(Folder.desktop.fsName + "/Sequence-from-SRT-log.txt"); lf.open("w"); lf.write(txt); lf.close(); } catch (e) {}

    var d = new Window("dialog", "Sequence from SRT");
    d.alignChildren = ["fill", "fill"];
    var et = d.add("edittext", undefined, txt, { multiline: true, scrolling: true, readonly: true });
    et.preferredSize = [720, 500];
    d.add("button", undefined, "Close").onClick = function () { d.close(); };
    d.show();
})();
