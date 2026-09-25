#!/usr/bin/env python3
"""Builds report.html for the 2026-09-24 weave from the session files (numbers are read, not typed).
Usage: build_report.py ["how Loudon feels after"]"""
import json, sys, html, os
from collections import defaultdict
AFTER = sys.argv[1] if len(sys.argv) > 1 else None
batch = json.load(open('batch-final.json'))
new_ids = {n['id'] for n in json.load(open('v2/targets.json'))['newcomers']}
cards = defaultdict(list)
for o in batch:
    if o['target'] in new_ids: cards[o['target']].append((o['source'], o['type']))
e = html.escape
def card(t, srcs):
    items = "".join(f"<li><span class='src'>{e(s)}</span> <span class='ty'>{e(ty)}</span></li>" for s, ty in srcs)
    return f"<div class='card'><div class='eyebrow'>now reached by</div><h4>{e(t)}</h4><ul>{items}</ul></div>"
cards_html = "".join(card(t, s) for t, s in sorted(cards.items(), key=lambda kv: -len(kv[1])))
after_html = f"<p class='quote'>“{e(AFTER)}”</p>" if AFTER else "<p class='quote pending'>to be asked at the close</p>"
page = f"""<!doctype html><html lang="en" class="skin-graphite"><head><meta charset="utf-8"><meta name="ceremony_version" content="1.0">
<meta name="viewport" content="width=device-width,initial-scale=1"><title>September Weave</title>
<link rel="stylesheet" href="../../../loudon-live/design-system/colors_and_type.css">
<style>
body{{background:var(--bg);color:var(--fg-1);font-family:var(--serif);font-size:var(--t-body-lg);line-height:1.75;margin:0}}
main{{max-width:880px;margin:0 auto;padding:48px 16px 80px}}
.eyebrow{{font-family:var(--mono);font-size:var(--t-eyebrow);letter-spacing:var(--tr-eyebrow);text-transform:uppercase;color:var(--fg-3)}}
h1{{font-family:var(--display);font-size:var(--t-h1);line-height:var(--lh-tight);letter-spacing:var(--tr-display);margin:.2em 0 .1em;font-weight:400}}
h2{{font-family:var(--sans);font-weight:var(--w-light);font-size:var(--t-h3);margin:2.2em 0 .5em;color:var(--fg-1)}}
h4{{font-family:var(--sans);font-weight:var(--w-medium);font-size:var(--t-body);margin:.2em 0 .4em}}
p,li{{color:var(--fg-2)}} .lead{{font-size:var(--t-lead);color:var(--fg-1)}}
.sigil{{width:72px;height:72px;float:right;margin-left:16px;opacity:.95}}
.row{{display:grid;grid-template-columns:repeat(auto-fit,minmax(150px,1fr));gap:12px;margin:1em 0}}
.stat{{background:var(--bg-elev-1);border:1px solid var(--border-soft);padding:14px}}
.stat b{{display:block;font-family:var(--display);font-size:var(--t-h2);font-weight:400;color:var(--fg-1)}}
.stat span{{font-family:var(--mono);font-size:var(--t-meta);color:var(--fg-3)}}
.feel{{display:grid;grid-template-columns:1fr 1fr;gap:12px}} .feel>div{{background:var(--bg-elev-1);padding:16px;border:1px solid var(--border-soft)}}
.quote{{font-style:italic;font-size:var(--t-h4);color:var(--fg-1);margin:.3em 0}} .pending{{color:var(--fg-3)}}
.cards{{display:grid;grid-template-columns:repeat(auto-fit,minmax(230px,1fr));gap:12px}}
.card{{background:var(--bg-elev-1);border:1px solid var(--border-soft);padding:14px}}
.card ul{{list-style:none;padding:0;margin:0}} .card li{{font-family:var(--sans);font-size:var(--t-caption);color:var(--fg-2)}}
.ty{{font-family:var(--mono);font-size:var(--t-meta);color:var(--accent-dim)}}
table{{width:100%;border-collapse:collapse;font-family:var(--sans);font-size:var(--t-caption)}}
th,td{{text-align:left;padding:8px 6px;border-bottom:1px solid var(--border-soft);color:var(--fg-2)}} th{{color:var(--fg-3);font-weight:var(--w-medium)}}
td.hi{{color:var(--fg-1)}} .wrap{{overflow-x:auto}}
ul.plain li{{margin:.35em 0}}
footer{{margin-top:64px;padding-top:16px;border-top:1px solid var(--border-soft);font-family:var(--sans);color:var(--fg-3);font-size:var(--t-caption)}}
@media (max-width:560px){{.feel{{grid-template-columns:1fr}} h1{{font-size:var(--t-h2)}}}}
</style></head><body><main>
<img class="sigil" src="../../../loudon-live/design-system/assets/logo-lissajous.svg" alt="">
<div class="eyebrow">Weave · 2026-09-24 · multi-lens, core · ceremony v1.0</div>
<h1>The September Weave</h1>
<p class="lead">The palace's periodic look at its own health and joy, across entries, agents and the people who use it. This one ran 79 days after the last, on a palace that felt, going in, good but cluttered.</p>

<div class="feel"><div><div class="eyebrow">before</div><p class="quote">“Good but cluttered”</p></div>
<div><div class="eyebrow">after</div>{after_html}</div></div>

<h2>What changed</h2>
<div class="row">
<div class="stat"><b>12</b><span>entries let go</span></div>
<div class="stat"><b>49</b><span>links that survived two skeptics</span></div>
<div class="stat"><b>9</b><span>new contradictions</span></div>
<div class="stat"><b>25</b><span>citizens linked to the method that made them</span></div>
<div class="stat"><b>17</b><span>stage moves</span></div>
<div class="stat"><b>1</b><span>new hub</span></div>
</div>
<p>Let go: Media Library, Octave Equivalence, Line-Art Layer Decomposition, Tristitia Generator, Claude CLI Reference, a spent handoff, and five interim people pages (Tarkovsky, Malick, Goldberg, Maloof, Schafer). Each repointed its links before going, and its gems moved to a living neighbour. The sonification question was folded into The Metaphor Stretch; the Toolkit's working notes became a bundle file; four spent files started composting. Ceremonies are now woven as graph nodes.</p>

<h2>Newcomers, and who now points at them</h2>
<p>The youngest entries get the boldest care: only a weave can wire the links that make them reachable.</p>
<div class="cards">{cards_html}</div>

<h2>What the palace found in itself</h2>
<ul class="plain">
<li><b>The Shop is Stoic.</b> Two bridge rooms, separately, read a Specialist's "I refuse jobs that want X, route to Y" as prohairesis. The Shop now exemplifies the dichotomy of control.</li>
<li><b>Annie Dillard contradicts BLUELINE.</b> The field notes stage a dying woman into ink-beautiful composition without asking the question Dillard can't stop asking.</li>
<li><b>Buber contradicts Heidegger</b>, and <b>Excellent Adventure contradicts Buber</b>: the meeting can't be made a method, and Excellent Adventure is the palace's method for meetings.</li>
<li><b>Quadratic Interpolation mirrors Reflective Practice</b>, through your own line that PID's overshoot "feels like a consciousness observing and reacting". The coordinator had declined it as a worker error; a rerun found it again, and the page proved the worker right.</li>
<li><b>Agent Wellbeing mirrors LaMa</b>: inpainting and self-report fail the same way, a plausible stand-in for what the system can't see.</li>
<li><b>Fuller mirrors Simondon</b>: held in July, re-found blind today.</li>
</ul>

<h2>Should the workers grow up?</h2>
<p>You asked whether the weave's errors came from running its workers as children. It was tested the same day, against a rule fixed before any result came back.</p>
<div class="wrap"><table><tr><th></th><th>Invalid</th><th>Would stand behind</th><th>Ranked first</th></tr>
<tr><td>Child</td><td>71%</td><td>24%</td><td>3 of 10</td></tr>
<tr><td>Schema-only</td><td>62%</td><td>34%</td><td>5 of 10</td></tr>
<tr><td>Elder</td><td>71%</td><td>21%</td><td>2 of 10</td></tr>
<tr><td class="hi">Child, fixed harness</td><td class="hi">64% (was 78%)</td><td class="hi">29% (was 20%)</td><td class="hi">5 of 8</td></tr></table></div>
<p>Growing up didn't help. Fixing the harness did: it took duplicate links from 13% to 2%. What remained was judgment, forced links, and the only thing that caught those was a second reader: the Concierge, blind judges, a rerun, and two skeptics per batch item. Recorded in Weave Ceremony — Context; not a rule until re-tested.</p>

<h2>What the coordinator got wrong</h2>
<ul class="plain">
<li>The catch-up counted symmetric links one way. It reported 17 unreachable entries; the true number was 1, and nearly half the first walk re-drew links that already existed. Fixed.</li>
<li>First-pass curation filed walk links and new introductions as settled. The Concierge sent that pile back.</li>
<li>Two merges were misread, one gloss was backwards, and one good link was wrongly declined.</li>
<li>Token estimates ran over, most of all the skeptic pass (2.6×). The whole day used about 12M worker tokens.</li>
</ul>

<h2>Carried forward</h2>
<ul class="plain">
<li>Pheromone trails: the held findings go to the board, and they fade after two weaves.</li>
<li>Their own sessions: the Producer layer (now pressed from three sides), whether the Shop can hold an operated Specialist, Two Batons' three homes, the board's <span class="ty">reconcileQueue</span>, and the hub bar (a Schema Ceremony).</li>
<li>Questions for you: six sources lived only in Media Library (Plato's Timaeus, Feynman, Turing, Debussy, Particles of Attachment, and Satie, Stockhausen and Merzbow). Do any want a line in Source Library? And Source Library still names the five composted people in plain text.</li>
<li>Three weave flags posted at today's close arrived after this weave's inbox was read. They open the next one.</li>
</ul>
<h2>What this run taught the ceremony</h2>
<ul class="plain">
<li>The six adjustments this run was planned around (the Bridge lens, the walk for newcomers, the sampled two-pile signing, the honest board, pheromone trails, cross-cycle convergence) were applied and are unverified — tuning entries 32–37.</li>
<li>Eight more were found during the run: the flag linter wrong both ways, ceremonies as nodes, the catch-up measuring reach, the harness over the workers' age, the second reader, one link per pair, the hub bar, all lenses at once — tuning entries 24–31.</li>
<li>The record is <span class="ty">_ops/Weave Ceremony/Weave Ceremony — tuning.md</span>.</li>
</ul>
<footer>Loud’n Live</footer>
</main></body></html>"""
open('report.html', 'w', encoding='utf-8').write(page); print("report.html written;", len(cards), "newcomer cards")
