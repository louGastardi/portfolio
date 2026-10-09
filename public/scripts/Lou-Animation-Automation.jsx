/**
 * Lou - Animation Automation
 * A ScriptUI panel for After Effects. One click adds expression-based
 * animations to the selected layers: slide entrances and exits, elastic
 * scale in, grow and shrink, fades, and a random subtle camera move per
 * layer. The expressions read the layer's own in and out points, so the
 * animations adapt when you trim or move a layer. It also sequences layers,
 * precomposes the selection, reverses the stacking order, times image layers
 * from an SRT transcript and copies the current frame to the clipboard.
 *
 * Install
 *   1. In After Effects choose File > Scripts > Install ScriptUI Panel and
 *      pick this file, or copy it into the "Scripts/ScriptUI Panels" folder
 *      of your After Effects installation.
 *   2. Restart After Effects.
 *   3. Open the panel from Window > Lou-Animation-Automation.jsx and dock it.
 *   You can also run it once as a floating window with
 *   File > Scripts > Run Script File.
 *
 * Usage: select one or more layers in the active comp, set the fields and
 *        click a button. Every action is a single undo step.
 *
 * Position (slides): an entrance and an exit can live on the same layer. The
 *                    settings are stored in a header comment inside the
 *                    expression and merged on each click.
 * Scale: elastic in, grow and shrink each REPLACE the scale expression.
 *
 * Tested on After Effects 2024 and later.
 * Author:  Lou Gastardi, https://lougastardi.github.io/portfolio/
 * License: MIT
 */

(function (thisObj) {

    // ---------- generic helpers ----------

    function getDur() {
        var d = parseFloat(ui.durField.text);
        return (isNaN(d) || d <= 0) ? 0.5 : d;
    }
    function getPct() {
        var p = parseFloat(ui.pctField.text);
        return isNaN(p) ? 20 : p;
    }
    function getFrames() {
        var n = parseInt(ui.frmField.text, 10);
        return (isNaN(n) || n <= 0) ? 10 : n;
    }
    function getMovePct() {
        var m = parseFloat(ui.moveField.text);
        return (isNaN(m) || m < 0) ? 10 : m;
    }
    function getZoomPct() {
        var z = parseFloat(ui.zoomField.text);
        return (isNaN(z) || z < 0) ? 8 : z;
    }

    function getComp() {
        var c = app.project.activeItem;
        if (!c || !(c instanceof CompItem)) {
            alert("Open a composition and select layers.");
            return null;
        }
        return c;
    }
    function getLayers(comp) {
        var ls = comp.selectedLayers;
        if (!ls || ls.length === 0) {
            alert("Select at least one layer.");
            return null;
        }
        return ls;
    }

    function tGroup(layer) { return layer.property("ADBE Transform Group"); }
    function posProp(layer) { return tGroup(layer).property("ADBE Position"); }
    function scaleProp(layer) { return tGroup(layer).property("ADBE Scale"); }
    function opacityProp(layer) { return tGroup(layer).property("ADBE Opacity"); }

    // Remove every keyframe on a property (leftovers from the keyframe version).
    function clearKeys(prop) {
        while (prop.numKeys > 0) prop.removeKey(1);
    }

    // Parse a "TAG|k=v|k=v" header line out of a property's expression.
    function readState(prop, tag) {
        if (!prop.expressionEnabled) return null;
        var ex = prop.expression;
        var re = new RegExp(tag + "\\|([^\\n\\r]*)");
        var m = ex.match(re);
        if (!m) return null;
        var parts = m[1].split("|");
        var o = {};
        for (var i = 0; i < parts.length; i++) {
            var kv = parts[i].split("=");
            o[kv[0]] = (kv.length > 1) ? kv[1] : "";
        }
        return o;
    }

    // Scrollable, always-closable report window (a plain alert() can grow past
    // the screen so its OK button becomes unreachable).
    function showReport(title, text) {
        var d = new Window("dialog", title);
        d.alignChildren = ["fill", "fill"];
        d.margins = 10; d.spacing = 8;
        var et = d.add("edittext", undefined, text, { multiline: true, scrolling: true, readonly: true });
        et.preferredSize = [660, 440];
        var bar = d.add("group"); bar.alignment = ["right", "bottom"];
        bar.add("button", undefined, "Close", { name: "ok" }).onClick = function () { d.close(); };
        d.show();
    }

    // ---------- expression builders ----------

    // Shared expression prelude: a RELIABLE layer end time (LEND).
    // In this AE, the expression-language `outPoint` returns garbage for PRECOMP
    // layers (e.g. 139.84s for a layer whose real outPoint is 19s), which broke
    // every EXIT animation on precomps. `inPoint + thisLayer.source.duration` is
    // reliable for any layer that HAS a source (footage/solid/precomp). Taking
    // Math.min with outPoint keeps normally-trimmed layers exact and neutralises
    // the precomp bug (its garbage outPoint is huge, so min picks the
    // source-based end). Layers with no source (text/shape/null) keep outPoint.
    // STILLS have source.duration 0, so inPoint+dur would collapse to inPoint,
    // so for them outPoint is reliable, use it. Only footage/precomp (dur>0) use
    // the min() guard against the precomp expression-outPoint bug.
    var LAYER_END =
        "hasSrc = (thisLayer.source != null);\n" +
        "srcDur = hasSrc ? thisLayer.source.duration : 0;\n" +
        "LEND = (hasSrc && srcDur > 0) ? Math.min(outPoint, inPoint + srcDur) : outPoint;\n";

    function buildPosExpr(st) {
        var inSide  = st.inSide  || "";
        var inDur   = (st.inDur  !== undefined && st.inDur  !== "") ? st.inDur  : "0.5";
        var outSide = st.outSide || "";
        var outDur  = (st.outDur !== undefined && st.outDur !== "") ? st.outDur : "0.5";
        return "" +
            "// REUSE_ANIM_POS|inSide=" + inSide + "|inDur=" + inDur +
                "|outSide=" + outSide + "|outDur=" + outDur + "\n" +
            "home = value;\n" +
            LAYER_END +
            "W = thisComp.width; H = thisComp.height;\n" +
            "function offset(side){\n" +
            "  var x = home[0], y = home[1];\n" +
            "  if (side == \"L\") x -= W;\n" +
            "  else if (side == \"R\") x += W;\n" +
            "  else if (side == \"T\") y -= H;\n" +
            "  else if (side == \"B\") y += H;\n" +
            "  return home.length > 2 ? [x, y, home[2]] : [x, y];\n" +
            "}\n" +
            "p = home;\n" +
            "inSide = \"" + inSide + "\"; inDur = " + inDur + ";\n" +
            "outSide = \"" + outSide + "\"; outDur = " + outDur + ";\n" +
            "if (inSide != \"\") {\n" +
            "  t1 = inPoint + Math.min(inDur, LEND - inPoint);\n" +
            "  if (time < t1) p = ease(time, inPoint, t1, offset(inSide), home);\n" +
            "}\n" +
            "if (outSide != \"\") {\n" +
            "  t0 = LEND - Math.min(outDur, LEND - inPoint);\n" +
            "  if (time > t0) p = ease(time, t0, LEND, home, offset(outSide));\n" +
            "}\n" +
            "p";
    }

    function buildElasticExpr(dur) {
        return "" +
            "// REUSE_ANIM_SCALE|mode=elastic|dur=" + dur + "\n" +
            LAYER_END +
            "d = Math.min(" + dur + ", LEND - inPoint);\n" +
            "t = time - inPoint;\n" +
            "c4 = (2*Math.PI)/3;\n" +
            "if (t <= 0) value*0\n" +
            "else if (t >= d) value\n" +
            "else {\n" +
            "  x = t/d;\n" +
            "  e = Math.pow(2, -10*x) * Math.sin((x*10 - 0.75)*c4) + 1;\n" +
            "  value * e\n" +
            "}";
    }

    // mode: "in" | "out" | "both"
    function buildFadeExpr(frames, mode) {
        var doIn = (mode === "in" || mode === "both");
        var doOut = (mode === "out" || mode === "both");
        // Anchored strictly to the LAYER's own life span, via the reliable LEND
        // (see LAYER_END prelude). The containing comp must NOT influence the
        // fade, so thisComp.duration is deliberately not used here.
        // frameDuration is only borrowed to convert the fade length frames→sec.
        return "" +
            "// REUSE_ANIM_OPACITY|frames=" + frames + "|mode=" + mode + "\n" +
            "f = " + frames + ";\n" +
            LAYER_END +
            "s = inPoint;\n" +
            "e = LEND;\n" +
            "life = e - s;\n" +
            "d = f * thisComp.frameDuration;\n" +
            "d = Math.min(d, life / 2);\n" +
            "ti = time - s;\n" +
            "to = e - time;\n" +
            "oi = " + (doIn ? "((ti < d) ? linear(ti, 0, d, 0, 100) : 100)" : "100") + ";\n" +
            "oo = " + (doOut ? "((to < d) ? linear(to, 0, d, 0, 100) : 100)" : "100") + ";\n" +
            "Math.min(oi, oo) * value / 100";
    }

    function buildDriftExpr(grow, pct) {
        var factor = grow ? (1 + pct / 100) : (1 - pct / 100);
        return "" +
            "// REUSE_ANIM_SCALE|mode=" + (grow ? "grow" : "shrink") + "|pct=" + pct + "\n" +
            "f = " + factor + ";\n" +
            LAYER_END +
            "u = linear(time, inPoint, LEND, 0, 1);\n" +
            "value * (1 + (f - 1) * u)";
    }

    // --- Randomizer builders (gradual drift over the layer duration) ---

    // Zoom drift on Scale. dir "in": 100 to 100+z%. dir "out": 100+z% to 100.
    // Never goes below the base scale, so no empty edges from zoom.
    function buildRandZoomExpr(zPct, dir) {
        var prog = (dir === "in") ? "u" : "(1 - u)";
        return "" +
            "// REUSE_ANIM_SCALE|mode=randzoom|dir=" + dir + "|z=" + zPct + "\n" +
            LAYER_END +
            "z = " + zPct + ";\n" +
            "u = linear(time, inPoint, LEND, 0, 1);\n" +
            "value * (1 + (z/100) * " + prog + ")";
    }

    // Constant safety zoom applied to Scale during a PAN so the pan travel never
    // reveals an empty edge. Amount = move% (matches the pan amplitude budget).
    function buildRandPanScaleExpr(mPct) {
        return "" +
            "// REUSE_ANIM_SCALE|mode=randpan|m=" + mPct + "\n" +
            "m = " + mPct + ";\n" +
            "value * (1 + m/100)";
    }

    // Pan drift on Position. dir "L"|"R"|"U"|"D". Travels within the safety-zoom
    // overscan (0.9 margin) so the opposite edge never shows.
    function buildRandPanPosExpr(mPct, dir) {
        var axisLine;
        if (dir === "L")      axisLine = "x = home[0] + ax*(1 - 2*u);\n";
        else if (dir === "R") axisLine = "x = home[0] - ax*(1 - 2*u);\n";
        else if (dir === "U") axisLine = "y = home[1] + ay*(1 - 2*u);\n";
        else                  axisLine = "y = home[1] - ay*(1 - 2*u);\n"; // "D"
        return "" +
            "// REUSE_ANIM_POS|mode=randpan|dir=" + dir + "|m=" + mPct + "\n" +
            "home = value;\n" +
            LAYER_END +
            "m = " + mPct + ";\n" +
            "u = linear(time, inPoint, LEND, 0, 1);\n" +
            "ax = 0.9 * (m/200) * thisComp.width;\n" +
            "ay = 0.9 * (m/200) * thisComp.height;\n" +
            "x = home[0]; y = home[1];\n" +
            axisLine +
            "home.length > 2 ? [x, y, home[2]] : [x, y]";
    }

    // ---------- actions ----------

    // which: "in" | "out"   dir: "L"|"R"|"T"|"B"
    function slide(which, dir) {
        var comp = getComp(); if (!comp) return;
        var layers = getLayers(comp); if (!layers) return;
        var dur = getDur();
        app.beginUndoGroup("Lou: " + (which === "in" ? "Entrance " : "Exit ") + dir);
        for (var i = 0; i < layers.length; i++) {
            var p = posProp(layers[i]);
            var st = readState(p, "REUSE_ANIM_POS") || { inSide: "", inDur: "0.5", outSide: "", outDur: "0.5" };
            if (which === "in") { st.inSide = dir; st.inDur = dur; }
            else { st.outSide = dir; st.outDur = dur; }
            clearKeys(p);
            p.expression = buildPosExpr(st);
        }
        app.endUndoGroup();
    }

    function scaleInElastic() {
        var comp = getComp(); if (!comp) return;
        var layers = getLayers(comp); if (!layers) return;
        var dur = getDur();
        app.beginUndoGroup("Lou: Elastic scale in");
        for (var i = 0; i < layers.length; i++) {
            var s = scaleProp(layers[i]);
            clearKeys(s);
            s.expression = buildElasticExpr(dur);
        }
        app.endUndoGroup();
    }

    function scaleDrift(grow) {
        var comp = getComp(); if (!comp) return;
        var layers = getLayers(comp); if (!layers) return;
        var pct = getPct();
        app.beginUndoGroup(grow ? "Lou: Grow" : "Lou: Shrink");
        for (var i = 0; i < layers.length; i++) {
            var s = scaleProp(layers[i]);
            clearKeys(s);
            s.expression = buildDriftExpr(grow, pct);
        }
        app.endUndoGroup();
    }

    // Fade on opacity, adapted to the layer duration. Fade length in frames
    // (default 10). Auto-updates when the layer is trimmed/stretched.
    // mode: "in" | "out" | "both"
    function fade(mode) {
        var comp = getComp(); if (!comp) return;
        var layers = getLayers(comp); if (!layers) return;
        var frames = getFrames();
        app.beginUndoGroup("Lou: Fade " + mode);
        for (var i = 0; i < layers.length; i++) {
            var o = opacityProp(layers[i]);
            clearKeys(o);
            o.expression = buildFadeExpr(frames, mode);
        }
        app.endUndoGroup();
    }

    // Clear our expressions from selected layers (position + scale + opacity).
    function clearAnim() {
        var comp = getComp(); if (!comp) return;
        var layers = getLayers(comp); if (!layers) return;
        app.beginUndoGroup("Lou: Clear animation");
        for (var i = 0; i < layers.length; i++) {
            var props = [posProp(layers[i]), scaleProp(layers[i]), opacityProp(layers[i])];
            for (var j = 0; j < props.length; j++) {
                var pr = props[j];
                if (pr.expressionEnabled && pr.expression.indexOf("REUSE_ANIM") !== -1) {
                    pr.expression = "";
                }
                clearKeys(pr);
            }
        }
        app.endUndoGroup();
    }

    // Lay selected layers back-to-back in time, no overlap (no precomp).
    // Each layer keeps its own duration; only its start time shifts.
    function sequenceLayers() {
        var comp = getComp(); if (!comp) return;
        var layers = getLayers(comp); if (!layers) return;
        var items = [];
        for (var i = 0; i < layers.length; i++) items.push({ idx: layers[i].index });
        items.sort(function (a, b) { return a.idx - b.idx; }); // top -> bottom
        app.beginUndoGroup("Lou: Sequence layers");
        var t = 0;
        for (var m = 0; m < items.length; m++) {
            var lyr = comp.layer(items[m].idx);
            lyr.startTime = lyr.startTime + (t - lyr.inPoint); // inPoint -> t
            t = lyr.outPoint;                                   // next starts here
        }
        app.endUndoGroup();
    }

    // All selected layers -> one single precomp (asks for a name).
    function precompSelection() {
        var comp = getComp(); if (!comp) return;
        var layers = getLayers(comp); if (!layers) return;
        var idxs = [];
        for (var i = 0; i < layers.length; i++) idxs.push(layers[i].index);
        var name = prompt("Precomp name:", "Precomp");
        if (name === null) return;       // cancelled
        if (name === "") name = "Precomp";
        app.beginUndoGroup("Lou: Precompose selection");
        comp.layers.precompose(idxs, name, true);
        app.endUndoGroup();
    }

    // Reverse the stacking order of the selected layers. They are re-stacked
    // just above the layer below the block (or at the bottom if none), so the
    // topmost selected ends up bottom and vice-versa.
    function reverseLayers() {
        var comp = getComp(); if (!comp) return;
        var layers = getLayers(comp); if (!layers) return;
        if (layers.length < 2) return;

        // Sort ascending by index (top -> bottom), then reverse.
        var asc = layers.slice(0).sort(function (a, b) { return a.index - b.index; });
        var bottomIdx = asc[asc.length - 1].index;
        var below = (bottomIdx < comp.numLayers) ? comp.layer(bottomIdx + 1) : null;
        var rev = asc.slice(0).reverse(); // R[0] = original bottom

        app.beginUndoGroup("Lou: Reverse order");
        // Insert each reversed layer just above `below`, in order, so the final
        // top->bottom stack equals the reversed list.
        for (var i = 0; i < rev.length; i++) {
            if (below) rev[i].moveBefore(below);
            else rev[i].moveToEnd();
        }
        app.endUndoGroup();
    }

    // Resolve a file from a pasted/dragged path field. Falls back to a dialog.
    function resolveFile(txt, title, mask) {
        var p = String(txt || "").replace(/^\s+|\s+$/g, "");
        if (p !== "") {
            if (/^file:\/\//i.test(p)) p = decodeURI(p.replace(/^file:\/\//i, ""));
            var f = new File(p);
            if (f.exists) return f;
        }
        return File.openDialog(title, mask);
    }

    // Time the frameNN layers using a Premiere-exported .srt (real speech
    // timing) + a cut sheet .md (frame <-> narration). Each MD row's narration
    // is matched to the SRT (fuzzy, monotonic) to get the real start. The
    // frame(s) span start..next-start (contiguous, no gap). Reused frames are
    // duplicated, multi-frame rows split their window. Re-runnable.
    // The cut sheet header is found by prefix: "FRAME..." and "NARR...", so
    // NARRATION and the Portuguese NARRAÇÃO both work.
    function sequenceFromSRT() {
        var comp = getComp(); if (!comp) return;
        var mdFile = resolveFile(ui.mdField ? ui.mdField.text : "", "1) Select the cut sheet (.md)", "*.md;*.txt;*.markdown");
        if (!mdFile) return;
        var srtFile = resolveFile(ui.srtField ? ui.srtField.text : "", "2) Select the transcript (.srt)", "*.srt;*.txt;*.vtt");
        if (!srtFile) return;
        mdFile.open("r"); var mdRaw = mdFile.read(); mdFile.close();
        srtFile.open("r"); srtFile.encoding = "UTF-8"; var srtRaw = srtFile.read(); srtFile.close();

        function trim(s) { return String(s).replace(/^\s+|\s+$/g, ""); }
        function normW(s) { return String(s).toLowerCase().replace(/[^a-z0-9]/g, ""); }
        function frameNum(s) { var m = String(s).match(/(\d+)/); return m ? parseInt(m[1], 10) : null; }
        function splitWords(s) {
            var r = String(s).split(/\s+/), o = [];
            for (var i = 0; i < r.length; i++) { var n = normW(r[i]); if (n !== "") o.push(n); }
            return o;
        }
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

        var srt = parseSRT(srtRaw), words = srt.words, END = srt.end;
        var rows = parseMD(mdRaw);
        if (words.length === 0) { alert("The SRT has no readable subtitles."); return; }
        if (rows.length === 0) { alert("No table found in the cut sheet. It needs a FRAME column and a NARRATION column."); return; }

        // Build segments. A row whose narration starts with "(" is a NOTE/b-roll
        // line. It is not spoken, so it does NOT anchor to the SRT. It attaches to
        // the previous spoken segment and shares its window. Spoken rows anchor via
        // the fuzzy monotonic matcher.
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
        var seen = {}, removed = 0;
        for (var dd = comp.numLayers; dd >= 1; dd--) {
            var Ld = comp.layer(dd);
            var nm = normName(Ld.name);
            if (!tokenSet[nm]) continue;   // only MD-referenced layers
            if (seen[nm]) { try { Ld.remove(); removed++; } catch (e) {} }
            else seen[nm] = true;
        }

        for (var si = 0; si < segs.length; si++) {
            var s2 = segs[si].start;
            var e2 = (si + 1 < segs.length) ? segs[si + 1].start : END;
            if (e2 <= s2) e2 = s2 + 0.5;
            var scLow = (segs[si].score !== "note" && parseInt(segs[si].score, 10) < 2); if (scLow) low++;
            // all frame tokens across every row in this segment, in order
            var toks = [];
            for (var rr = 0; rr < segs[si].rows.length; rr++) {
                var rawNames = rows[segs[si].rows[rr]].frame.split(/\s*[\/,]\s*/);
                for (var q = 0; q < rawNames.length; q++) { var tk = trim(rawNames[q]); if (tk !== "") toks.push(tk); }
            }
            var seg = (e2 - s2) / (toks.length || 1);
            for (var n = 0; n < toks.length; n++) {
                var token = toks[n], a = s2 + seg * n, b = s2 + seg * (n + 1);
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

        // Restack by time: top layer = earliest, descending = later, so the
        // timeline reads as a clean staircase (easy to follow which frame shows).
        var fl = [];
        for (var fi = 1; fi <= comp.numLayers; fi++) { var FL = comp.layer(fi); if (tokenSet[normName(FL.name)]) fl.push(FL); }
        fl.sort(function (x, y) { return x.inPoint - y.inPoint; });
        for (var so = fl.length - 1; so >= 0; so--) { try { fl[so].moveToBeginning(); } catch (e) {} }

        app.endUndoGroup();

        var txt = "Sequence from SRT · comp: " + comp.name +
                  "\nCut sheet rows: " + rows.length + "  placed: " + done + "  duplicated: " + dups +
                  "  problems: " + miss + "  weak matches: " + low + "  (removed " + removed + " repeats)" +
                  "\nSRT: " + words.length + " words, ends at " + END.toFixed(2) + "s" +
                  "\n-------------------------------------------\n" + log.join("\n");
        try { var lf = new File(Folder.desktop.fsName + "/Sequence-from-SRT-log.txt"); lf.open("w"); lf.write(txt); lf.close(); } catch (e) {}
        showReport("Sequence from SRT", txt);
    }

    // Clear only OUR (REUSE_ANIM) expression + keyframes from a property.
    function clearReuse(pr) {
        try {
            if (pr.expressionEnabled && pr.expression.indexOf("REUSE_ANIM") !== -1) pr.expression = "";
        } catch (e) {}
        clearKeys(pr);
    }

    // Give every AV layer in the comp ONE random subtle move (zoom in/out or a
    // pan L/R/U/D), never repeating the same move on stacking-consecutive
    // layers. Pans carry a safety zoom so no empty edge shows. Cameras/lights
    // (no Scale) are skipped.
    function randomizeMoves() {
        var comp = getComp(); if (!comp) return;
        var layers = getLayers(comp); if (!layers) return;   // SELECTED only
        var move = getMovePct();
        var zoom = getZoomPct();

        var MOVES = ["zin", "zout", "L", "R", "U", "D"];

        // Sort the selection top -> bottom so "consecutive" means neighbours.
        var sel = layers.slice(0).sort(function (a, b) { return a.index - b.index; });

        app.beginUndoGroup("Lou: Randomize moves");
        var prev = null, applied = 0;
        for (var k = 0; k < sel.length; k++) {
            var lyr = sel[k];
            var tg = lyr.property("ADBE Transform Group");
            var scl = tg ? tg.property("ADBE Scale") : null;
            var pos = tg ? tg.property("ADBE Position") : null;
            if (!scl || !pos) continue;   // camera/light/etc.

            // Pick a move different from the previous layer's.
            var mv;
            do { mv = MOVES[Math.floor(Math.random() * MOVES.length)]; }
            while (mv === prev && MOVES.length > 1);
            prev = mv;

            clearReuse(scl);
            clearReuse(pos);
            if (mv === "zin" || mv === "zout") {
                scl.expression = buildRandZoomExpr(zoom, (mv === "zin") ? "in" : "out");
            } else {
                scl.expression = buildRandPanScaleExpr(move);
                pos.expression = buildRandPanPosExpr(move, mv);
            }
            applied++;
        }
        app.endUndoGroup();
        if (applied === 0) alert("No selected layer has Scale and Position.");
    }

    // Capture the CURRENT frame of the active comp and put it on the macOS
    // clipboard as a PNG image (so it can be pasted into Photoshop, etc.).
    // Flow: comp.saveFrameToPng -> temp PNG -> osascript sets the clipboard.
    function copyFrameToClipboard() {
        var comp = getComp(); if (!comp) return;

        if (typeof comp.saveFrameToPng !== "function") {
            alert("This version of After Effects has no saveFrameToPng().");
            return;
        }

        var path = Folder.temp.fsName + "/lou_frame_clip.png";
        var f = new File(path);
        try {
            if (f.exists) f.remove();
            comp.saveFrameToPng(comp.time, f);   // current playhead time
        } catch (e) {
            alert("Could not save the frame: " + e.toString());
            return;
        }
        // saveFrameToPng writes ASYNC. Poll until the file size is STABLE (stops
        // growing), not merely > 0. Otherwise the clipboard grabs a
        // half-written PNG (top of image real, rest blank/white). Require the
        // length to hold steady for ~300ms, up to an 8s ceiling.
        var waited = 0, last = -1, stable = 0;
        while (waited < 8000) {
            f = new File(path);
            var L = (f.exists ? f.length : -1);
            if (L > 0 && L === last) {
                stable += 50;
                if (stable >= 300) break;   // size unchanged long enough = done
            } else {
                stable = 0;
            }
            last = L;
            $.sleep(50);
            waited += 50;
        }
        if (!f.exists || f.length <= 0) {
            alert("The PNG was not created (waited " + (waited / 1000) + "s).");
            return;
        }

        // Mac only: load the PNG bytes onto the clipboard via AppleScript.
        if ($.os.toLowerCase().indexOf("mac") === -1) {
            alert("Copy to clipboard only works on macOS.\nPNG saved to:\n" + f.fsName);
            return;
        }
        var LAQUO = String.fromCharCode(171); // «
        var RAQUO = String.fromCharCode(187); // »
        var appleScript = 'set the clipboard to (read (POSIX file "' + f.fsName +
                          '") as ' + LAQUO + 'class PNGf' + RAQUO + ')';
        var cmd = "osascript -e \"" + appleScript.replace(/"/g, '\\"') + "\"";
        var res = system.callSystem(cmd);
        if (res && res.length > 0) {
            alert("osascript returned:\n" + res + "\nPNG at:\n" + f.fsName);
        }
    }

    // ---------- UI ----------

    var ui = {};

    function build(thisObj) {
        var w = (thisObj instanceof Panel)
            ? thisObj
            : new Window("palette", "Lou - Animation Automation", undefined, { resizeable: true });
        w.alignChildren = ["fill", "top"];
        w.spacing = 8;
        w.margins = 12;

        var params = w.add("group");
        params.orientation = "row";
        params.alignChildren = ["left", "center"];
        params.add("statictext", undefined, "In/Out (s):");
        ui.durField = params.add("edittext", undefined, "0.5");
        ui.durField.characters = 4;
        params.add("statictext", undefined, "Scale %:");
        ui.pctField = params.add("edittext", undefined, "20");
        ui.pctField.characters = 4;
        params.add("statictext", undefined, "Fade (frames):");
        ui.frmField = params.add("edittext", undefined, "10");
        ui.frmField.characters = 4;

        var pin = w.add("panel", undefined, "Entrances (slide into place)");
        pin.orientation = "row"; pin.alignChildren = ["fill", "center"]; pin.margins = 10;
        pin.add("button", undefined, "← Left").onClick = function () { slide("in", "L"); };
        pin.add("button", undefined, "Right →").onClick = function () { slide("in", "R"); };
        pin.add("button", undefined, "↑ Up").onClick = function () { slide("in", "T"); };
        pin.add("button", undefined, "↓ Down").onClick = function () { slide("in", "B"); };

        var pout = w.add("panel", undefined, "Exits (slide out)");
        pout.orientation = "row"; pout.alignChildren = ["fill", "center"]; pout.margins = 10;
        pout.add("button", undefined, "← Left").onClick = function () { slide("out", "L"); };
        pout.add("button", undefined, "Right →").onClick = function () { slide("out", "R"); };
        pout.add("button", undefined, "↑ Up").onClick = function () { slide("out", "T"); };
        pout.add("button", undefined, "↓ Down").onClick = function () { slide("out", "B"); };

        var psc = w.add("panel", undefined, "Scale");
        psc.orientation = "row"; psc.alignChildren = ["fill", "center"]; psc.margins = 10;
        psc.add("button", undefined, "Elastic Scale In").onClick = function () { scaleInElastic(); };
        psc.add("button", undefined, "Grow X%").onClick = function () { scaleDrift(true); };
        psc.add("button", undefined, "Shrink X%").onClick = function () { scaleDrift(false); };

        var pop = w.add("panel", undefined, "Opacity");
        pop.orientation = "row"; pop.alignChildren = ["fill", "center"]; pop.margins = 10;
        pop.add("button", undefined, "Fade In").onClick = function () { fade("in"); };
        pop.add("button", undefined, "Fade Out").onClick = function () { fade("out"); };
        pop.add("button", undefined, "Fade In+Out").onClick = function () { fade("both"); };

        var psrt = w.add("panel", undefined, "Sequence from SRT (paste a path or click …)");
        psrt.orientation = "column"; psrt.alignChildren = ["fill", "center"]; psrt.margins = 10; psrt.spacing = 6;
        var rowMd = psrt.add("group"); rowMd.orientation = "row"; rowMd.alignChildren = ["left", "center"];
        rowMd.add("statictext", undefined, "MD :");
        ui.mdField = rowMd.add("edittext", undefined, ""); ui.mdField.characters = 42;
        rowMd.add("button", undefined, "…").onClick = function () { var f = File.openDialog("Select the cut sheet (.md)", "*.md;*.txt;*.markdown"); if (f) ui.mdField.text = f.fsName; };
        var rowSrt = psrt.add("group"); rowSrt.orientation = "row"; rowSrt.alignChildren = ["left", "center"];
        rowSrt.add("statictext", undefined, "SRT:");
        ui.srtField = rowSrt.add("edittext", undefined, ""); ui.srtField.characters = 42;
        rowSrt.add("button", undefined, "…").onClick = function () { var f = File.openDialog("Select the transcript (.srt)", "*.srt;*.txt;*.vtt"); if (f) ui.srtField.text = f.fsName; };
        psrt.add("button", undefined, "Sequence from SRT").onClick = function () { sequenceFromSRT(); };

        var ppc = w.add("panel", undefined, "Organize");
        ppc.orientation = "row"; ppc.alignChildren = ["fill", "center"]; ppc.margins = 10;
        ppc.add("button", undefined, "Sequence").onClick = function () { sequenceLayers(); };
        ppc.add("button", undefined, "Precompose Selection").onClick = function () { precompSelection(); };
        ppc.add("button", undefined, "Reverse Order").onClick = function () { reverseLayers(); };

        var prnd = w.add("panel", undefined, "Random (1 move per layer)");
        prnd.orientation = "column"; prnd.alignChildren = ["fill", "center"]; prnd.margins = 10; prnd.spacing = 6;
        var rndFields = prnd.add("group");
        rndFields.orientation = "row"; rndFields.alignChildren = ["left", "center"];
        rndFields.add("statictext", undefined, "Move %:");
        ui.moveField = rndFields.add("edittext", undefined, "10");
        ui.moveField.characters = 4;
        rndFields.add("statictext", undefined, "Zoom %:");
        ui.zoomField = rndFields.add("edittext", undefined, "8");
        ui.zoomField.characters = 4;
        prnd.add("button", undefined, "Randomize Moves").onClick = function () { randomizeMoves(); };

        var putil = w.add("group");
        putil.orientation = "row"; putil.alignChildren = ["fill", "center"];
        putil.add("button", undefined, "Clear Animation").onClick = function () { clearAnim(); };
        putil.add("button", undefined, "Copy Frame to Clipboard").onClick = function () { copyFrameToClipboard(); };

        w.layout.layout(true);
        return w;
    }

    var panel = build(thisObj);
    if (panel instanceof Window) { panel.center(); panel.show(); }

})(this);
