#!/usr/bin/env python3
"""Generate a walk-cycle as OpenPose (COCO-18) skeleton control images for ControlNet.
Outputs pose_00.png .. pose_{N-1}.png on black, plus a contact sheet."""
import math
from pathlib import Path
from PIL import Image, ImageDraw

W, H = 832, 1216
N = 30                      # frames
OUT = Path("/sessions/beautiful-zen-allen/mnt/outputs/runpod-backend/walkcycle")
OUT.mkdir(parents=True, exist_ok=True)

# COCO-18 limb pairs and canonical OpenPose colors
LIMBS = [
 (1,2,(255,0,0)),(1,5,(255,85,0)),(2,3,(255,170,0)),(3,4,(255,255,0)),
 (5,6,(170,255,0)),(6,7,(85,255,0)),(1,8,(0,255,0)),(8,9,(0,255,85)),
 (9,10,(0,255,170)),(1,11,(0,255,255)),(11,12,(0,170,255)),(12,13,(0,85,255)),
 (1,0,(0,0,255)),(0,14,(85,0,255)),(14,16,(170,0,255)),(0,15,(255,0,255)),(15,17,(255,0,170)),
]
KPT_COLOR = {0:(255,0,0),1:(255,85,0),2:(255,170,0),3:(255,255,0),4:(170,255,0),
 5:(85,255,0),6:(0,255,0),7:(0,255,85),8:(0,255,170),9:(0,255,255),10:(0,170,255),
 11:(0,85,255),12:(0,0,255),13:(85,0,255),14:(170,0,255),15:(255,0,255),16:(255,0,170),17:(255,0,85)}

def skeleton(t):
    """t in [0,1) -> 18 keypoints for a walk-cycle pose. Side-ish front view."""
    cx = W*0.5
    bob = math.sin(2*math.pi*t*2)*8          # vertical bob, twice per cycle
    hipY = H*0.52 + bob
    neckY = H*0.30 + bob
    headY = H*0.20 + bob
    sh = W*0.085      # half shoulder width
    hw = W*0.055      # half hip width
    thigh, shin = H*0.16, H*0.16
    uarm, farm = H*0.12, H*0.13
    swing = math.sin(2*math.pi*t)            # leg/arm swing phase
    # thigh angles (radians from vertical); legs opposite phase
    aR = swing*0.5
    aL = -swing*0.5
    def leg(hipx, ang, fwdphase):
        kx = hipx + math.sin(ang)*thigh
        ky = hipY + math.cos(ang)*thigh
        # knee bends more on the back-swing/lift
        bend = 0.5 + 0.5*max(0,-math.cos(2*math.pi*(t+fwdphase)))
        kang = ang + bend*0.7
        ax = kx + math.sin(kang)*shin
        ay = ky + math.cos(kang)*shin
        return (kx,ky),(ax,ay)
    (rk,ra)=leg(cx-hw, aR, 0.0)
    (lk,la)=leg(cx+hw, aL, 0.5)
    def arm(shx, ang):
        ex = shx + math.sin(ang)*uarm
        ey = neckY + math.cos(ang)*uarm
        wx = ex + math.sin(ang*1.1)*farm
        wy = ey + math.cos(ang*1.1)*farm
        return (ex,ey),(wx,wy)
    (re,rw)=arm(cx-sh, -aR*0.8)
    (le,lw)=arm(cx+sh, -aL*0.8)
    return {
     0:(cx,headY),1:(cx,neckY),2:(cx-sh,neckY),3:re,4:rw,5:(cx+sh,neckY),6:le,7:lw,
     8:(cx-hw,hipY),9:rk,10:ra,11:(cx+hw,hipY),12:lk,13:la,
     14:(cx-12,headY-6),15:(cx+12,headY-6),16:(cx-26,headY+2),17:(cx+26,headY+2),
    }

def draw(kp):
    img = Image.new("RGB",(W,H),(0,0,0)); d=ImageDraw.Draw(img)
    for a,b,c in LIMBS:
        d.line([kp[a],kp[b]], fill=c, width=12)
    for i,(x,y) in kp.items():
        r=7; d.ellipse([x-r,y-r,x+r,y+r], fill=KPT_COLOR.get(i,(255,255,255)))
    return img

frames=[]
for i in range(N):
    t=(i/ N)*2 % 1.0          # ~2 full strides across the sequence
    img=draw(skeleton(t)); img.save(OUT/f"pose_{i:02d}.png"); frames.append(img)

# contact sheet
cols,rows=6,5; cw,ch=130,190; pad=4
sheet=Image.new("RGB",(cols*cw+pad*(cols+1),rows*ch+pad*(rows+1)),(15,15,18))
for i,im in enumerate(frames):
    r,c=divmod(i,cols); sheet.paste(im.resize((cw,ch)),(pad+c*(cw+pad),pad+r*(ch+pad)))
sheet.save(OUT/"_contact_sheet.png")
print(f"wrote {N} pose frames + contact sheet to {OUT}")
