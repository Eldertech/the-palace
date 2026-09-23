#!/usr/bin/env python3
"""Render the collapse as a three-panel PNG, straight from viz-data.json.
Same projection, same colours as the page — this is the still of the money shot."""
import json
from PIL import Image, ImageDraw, ImageFont

D = json.load(open("viz-data.json"))
BG=(10,10,15); GRID=(34,34,46); FG=(200,200,216); DIM=(122,122,150)
TYPE_COLOR={'concept':(232,184,74),'project':(107,212,90),'person':(176,124,255),
 'practice':(74,143,255),'meta':(255,111,174),'specialist':(255,107,90),
 'hub':(255,255,255),'source':(138,138,160),'maker':(255,155,74),
 'question':(138,138,160),'spore':(138,138,160)}

def font(sz, mono=True):
    for p in ("/System/Library/Fonts/SFNSMono.ttf","/System/Library/Fonts/Menlo.ttc",
              "/System/Library/Fonts/Supplemental/Courier New.ttf"):
        try: return ImageFont.truetype(p, sz)
        except OSError: pass
    return ImageFont.load_default()

PANEL=520; PAD=26; TOP=54; BOT=58
frames=[("repulsive|1.0|0.0",0,"DEPTH 0","the raw entries"),
        ("repulsive|1.0|0.0",10,"DEPTH 10  ·  CONTRADICTS -1","sorted: contraries held apart"),
        ("disarmed|1.0|0.0",10,"DEPTH 10  ·  CONTRADICTS +1","collapsed: every distinction gone")]

W=PANEL*3+PAD*4; H=PANEL+TOP+BOT
img=Image.new("RGB",(W,H),BG); dr=ImageDraw.Draw(img,"RGBA")
f1=font(12); f2=font(11)

for k,(key,depth,title,sub) in enumerate(frames):
    ox=PAD+k*(PANEL+PAD); oy=TOP
    dr.rectangle([ox,oy,ox+PANEL,oy+PANEL], outline=(40,40,54))
    cx,cy=ox+PANEL/2, oy+PANEL/2; R=PANEL/2-14
    dr.line([ox+8,cy,ox+PANEL-8,cy], fill=GRID)
    dr.line([cx,oy+8,cx,oy+PANEL-8], fill=GRID)
    P=D["runs"][key]["proj"][depth]
    for i,(px,py) in enumerate(P):
        n=D["nodes"][i]
        c=TYPE_COLOR.get(n["type"],DIM)
        r=1.8+min(n["deg"],40)/40*3.2
        x,y=cx+px*R, cy-py*R
        if not (ox+3 <= x <= ox+PANEL-3 and oy+3 <= y <= oy+PANEL-3):
            continue
        dr.ellipse([x-r*2.1,y-r*2.1,x+r*2.1,y+r*2.1], fill=c+(46,))
        dr.ellipse([x-r,y-r,x+r,y+r], fill=c+(235,))
    dr.text((ox,26), title, font=f1, fill=(232,184,74) if k else FG)
    dr.text((ox,oy+PANEL+11), sub, font=f2, fill=DIM)
    sp=D["runs"][key]["spread"][depth]
    con=D["runs"][key]["contra"][depth]; mir=D["runs"][key]["mirror"][depth]
    ratio = con/mir if mir>1e-6 else float('inf')
    dr.text((ox, oy+PANEL+29),
            f"spread {sp:.4f}    contra/mirror {ratio:.1f}x", font=f2, fill=(232,184,74) if k==1 else (74,74,90))

dr.text((PAD,8), "MESSAGE PASSING ON THE PALACE  ·  310 ENTRIES  ·  2,402 TYPED LINKS  ·  NOTHING TRAINED",
        font=f2, fill=DIM)
img.save("collapse.png")
print("wrote collapse.png", img.size)
