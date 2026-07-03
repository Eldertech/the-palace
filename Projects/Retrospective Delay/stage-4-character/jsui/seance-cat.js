// seance-cat.js — JSUI character for Retrospective Delay
// One input: gain (0..1). Three gorey-ink pose PNGs crossfade across the range.
//   gain 0.00–0.25  dormant   (curled, sleeping, no ectoplasm)
//   gain 0.25–0.75  awakening (rising, reaching, ectoplasm forming)
//   gain 0.75–1.00  triumphant (arms out, stars in eyes, swirling)
// Pose plates are the greenlit gorey-ink refined renders; live ectoplasm
// swirl is drawn on top so the still poses still move.
// Drop in a [jsui] box, set @rect 0 0 240 240, send a float 0..1 to set_gain.

inlets = 1;
outlets = 1;
mgraphics.init();
mgraphics.relative_coords = 0;
mgraphics.autofill = 0;

var gain = 0.0;
var t = 0; // ectoplasm clock

// Pose plates — Max searches the patcher's folder + file preferences search
// path. The PNGs sit beside this .js file (pose-dormant/awakening/triumphant).
var poseDormant   = new Image("pose-dormant.png");
var poseAwakening = new Image("pose-awakening.png");
var poseTriumphant = new Image("pose-triumphant.png");

function set_gain(v) {
    gain = Math.max(0, Math.min(1, v));
    mgraphics.redraw();
}

function bang() { mgraphics.redraw(); }

function ss(edge0, edge1, x) {
    var u = Math.max(0, Math.min(1, (x - edge0) / (edge1 - edge0)));
    return u * u * (3 - 2 * u);
}

function paint() {
    t += 0.04;
    var w = box.rect[2] - box.rect[0];
    var h = box.rect[3] - box.rect[1];

    // séance parlor background — dims as gain rises (lights going down)
    var bgv = 0.18 - 0.10 * gain;
    mgraphics.set_source_rgb(bgv, bgv * 0.6, bgv * 1.4);
    mgraphics.rectangle(0, 0, w, h);
    mgraphics.fill();

    var wDor = 1 - ss(0.15, 0.40, gain);
    var wAwa = ss(0.15, 0.40, gain) * (1 - ss(0.60, 0.85, gain));
    var wTri = ss(0.60, 0.85, gain);

    if (wDor   > 0.01) drawPose(poseDormant,   w, h, wDor);
    if (wAwa   > 0.01) drawPose(poseAwakening, w, h, wAwa);
    if (wTri   > 0.01) drawPose(poseTriumphant, w, h, wTri);

    var ecto = Math.max(wAwa, wTri);
    if (ecto > 0.01) drawEctoplasm(w, h, ecto);
}

function drawPose(img, w, h, a) {
    if (!img) return;
    // image_surface_draw: source rect (whole image) → dest rect (whole box)
    // alpha controlled via global_alpha so the crossfade works on PNGs.
    mgraphics.save();
    mgraphics.set_source_rgba(1, 1, 1, a);
    mgraphics.image_surface_draw(img, [0, 0, img.size[0], img.size[1]], [0, 0, w, h]);
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
        mgraphics.set_source_rgba(0.55, 0.78, 0.90, 0.25 * a);
        mgraphics.set_line_width(3.0);
        mgraphics.stroke();
    }
}

// animate while gain > 0 — ectoplasm swirl needs ~30fps
var animTask = new Task(function() {
    if (gain > 0.01) mgraphics.redraw();
}, this);
animTask.interval = 33;
animTask.repeat(-1);
