// seance-cat.js — JSUI character for Retrospective Delay
// One input: gain (0..1). Three gorey-ink pose plates crossfade across the range.
//   gain 0.00–0.25  dormant    (curled, sleeping, no ectoplasm)
//   gain 0.25–0.75  awakening  (rising, reaching, ectoplasm forming)
//   gain 0.75–1.00  triumphant (arms out, stars in eyes, swirling)
// Pose plates are the greenlit gorey-ink refined renders: opaque pen-and-ink
// on parchment, 1024². Ectoplasm is drawn live on top so the stills still move.
// Drop in a [jsui] box, @rect 0 0 240 240, send a float 0..1 to set_gain.

inlets = 1;
outlets = 1;
mgraphics.init();
mgraphics.relative_coords = 0;
mgraphics.autofill = 0;

var gain = 0.0;
var t = 0; // ectoplasm clock

// Pose plates — Max searches the patcher's folder + the file-preferences
// search path. The PNGs sit beside this .js file.
var poseDormant    = new Image("pose-dormant.png");
var poseAwakening  = new Image("pose-awakening.png");
var poseTriumphant = new Image("pose-triumphant.png");

function set_gain(v) {
    gain = Math.max(0, Math.min(1, v));
    mgraphics.redraw();
}
function msg_float(v) { set_gain(v); }
function bang() { mgraphics.redraw(); }

function ss(edge0, edge1, x) {
    var u = Math.max(0, Math.min(1, (x - edge0) / (edge1 - edge0)));
    return u * u * (3 - 2 * u);
}

function paint() {
    t += 0.04;
    var w = box.rect[2] - box.rect[0];
    var h = box.rect[3] - box.rect[1];

    // Parchment floor. The plates are opaque, so this only shows in the
    // first frame and under any letterboxing — keep it paper, not parlor.
    mgraphics.set_source_rgb(0.86, 0.82, 0.72);
    mgraphics.rectangle(0, 0, w, h);
    mgraphics.fill();

    var wDor = 1 - ss(0.15, 0.40, gain);
    var wAwa = ss(0.15, 0.40, gain) * (1 - ss(0.60, 0.85, gain));
    var wTri = ss(0.60, 0.85, gain);

    // Painter's order: the plate that is fading IN goes on top of the one
    // fading out, so the alpha actually reads as a dissolve.
    drawPose(poseDormant,    w, h, 1.0);            // always the base coat
    if (wAwa + wTri > 0.005) drawPose(poseAwakening,  w, h, Math.min(1, wAwa + wTri));
    if (wTri > 0.005)        drawPose(poseTriumphant, w, h, wTri);

    var ecto = Math.max(wAwa, wTri);
    if (ecto > 0.01) drawEctoplasm(w, h, ecto);

    // Lights-down vignette: heavy while the ghost is dormant, lifting as the
    // séance takes. Drawn OVER the plates because the plates are opaque.
    drawVignette(w, h, 0.55 * (1 - gain));
}

// Max's mgraphics ignores the source colour for image_surface_draw, so an
// alpha set with set_source_rgba does nothing: the plate lands fully opaque
// and the "crossfade" pops. set_source_surface + paint_with_alpha is the path
// that actually blends. (Fixed cycle 19 — the wired preview strip is the proof.)
function drawPose(img, w, h, a) {
    if (!img) return;
    a = Math.max(0, Math.min(1, a));
    if (a <= 0.004) return;
    var iw = img.size[0], ih = img.size[1];
    mgraphics.save();
    mgraphics.rectangle(0, 0, w, h);
    mgraphics.clip();
    mgraphics.scale(w / iw, h / ih);   // plates are square; box should be too
    mgraphics.set_source_surface(img, 0, 0);
    mgraphics.paint_with_alpha(a);
    mgraphics.restore();
}

function drawEctoplasm(w, h, a) {
    var cx = w * 0.5, cy = h * 0.55;
    for (var i = 0; i < 3; i++) {
        var phase = t + i * 2.094;
        var r = w * (0.18 + 0.05 * i);
        var x0 = cx + Math.cos(phase) * r;
        var y0 = cy + Math.sin(phase) * r * 0.6;
        var x1 = cx + Math.cos(phase + 1.2) * r * 1.3;
        var y1 = cy + Math.sin(phase + 1.2) * r * 0.6;
        mgraphics.move_to(x0, y0);
        mgraphics.curve_to(cx, cy - h * 0.15, cx + w * 0.10, cy - h * 0.05, x1, y1);
        // ink, not neon — the plates are pen-and-ink and cyan is a palace never.
        mgraphics.set_source_rgba(0.13, 0.11, 0.10, 0.30 * a);
        mgraphics.set_line_width(2.4);
        mgraphics.stroke();
    }
}

function drawVignette(w, h, a) {
    if (a <= 0.01) return;
    mgraphics.set_source_rgba(0.06, 0.05, 0.08, a);
    mgraphics.rectangle(0, 0, w, h);
    mgraphics.fill();
}

// animate while the ghost has any presence — ectoplasm swirl wants ~30fps
var animTask = new Task(function() {
    if (gain > 0.01) mgraphics.redraw();
}, this);
animTask.interval = 33;
animTask.repeat(-1);
