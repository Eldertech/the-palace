#!/usr/bin/env python3
"""Walk-cycle through the eras: pose-locked FLUX + ControlNet. submit | poll"""
import json, sys
from pathlib import Path
import pod_comfy as pc

POSES = Path("/sessions/beautiful-zen-allen/mnt/outputs/runpod-backend/walkcycle")
OUT = Path("/sessions/beautiful-zen-allen/mnt/The Palace/RunPod Images/flux/walk_movie")
STATE = Path("/tmp/walkmovie.json")
SEED = 555

ANCHOR = ("A full-body cinematic photograph of the same man walking, mid-stride, full body visible head to toe, "
 "centered in frame, against a plain softly out-of-focus neutral grey studio background. ")
ERAS = [
 ("1890s","a Victorian frock coat, top hat and cravat"),
 ("1900s","an Edwardian three-piece wool suit and bowler hat"),
 ("1910s","a high-button sack suit and derby hat"),
 ("1920s","a pinstripe suit, fedora and spats"),
 ("1930s","a double-breasted suit with a wide tie"),
 ("1940s","a wide-shouldered 1940s suit and hat"),
 ("1950s","a grey flannel suit, skinny tie and hat"),
 ("1960s","a slim Mad-Men suit with narrow lapels"),
 ("1970s","a wide-lapel earth-tone suit with flared trousers"),
 ("1980s","an 80s power suit with padded shoulders and a bold tie"),
 ("1990s","a minimalist 90s Armani-style suit"),
 ("2000s","a boxy Y2K suit"),
 ("2010s","a slim-fit modern suit with no tie"),
 ("2020s","a smart-casual blazer with white sneakers"),
 ("2030s","a sleek techwear business suit with a high collar"),
 ("2040s","a smart-fabric suit with subtle glowing LED pinstripes"),
 ("2050s","a suit with holographic iridescent accents"),
 ("2060s","a liquid-metal chrome iridescent suit"),
 ("2070s","a bioluminescent woven-fiber suit"),
 ("2080s","a hard-shell exo-armor business suit"),
 ("2090s","a translucent glass smart-suit"),
 ("2100s","an energy-field plasma business attire"),
 ("2110s","a morphing nano-fiber suit"),
 ("2120s","an anti-grav suit with floating panels"),
 ("2130s","a crystalline photonic suit"),
 ("2140s","a living symbiotic organism suit"),
 ("2150s","a body-suit of pure light constructs"),
 ("2160s","a suit woven from cosmic stardust"),
 ("2170s","a shimmering time-distortion suit"),
 ("2180s","a suit of pure radiant transcendent energy"),
]

def prompt_for(i):
    era, outfit = ERAS[i]
    return ANCHOR + f"He wears {outfit} — {era} style. Photorealistic, sharp focus, highly detailed, dramatic studio lighting."

def submit():
    st = {}
    for i in range(30):
        name = pc.upload_image(str(POSES/f"pose_{i:02d}.png"), name=f"wpose_{i:02d}.png")
        pid = pc.submit(pc.workflow(prompt_for(i), name, SEED))
        st[pid] = {"i": i, "era": ERAS[i][0], "saved": None}
        print(f"submitted frame {i:02d} {ERAS[i][0]}  {pid}")
    STATE.write_text(json.dumps(st, indent=2))

def poll():
    OUT.mkdir(parents=True, exist_ok=True)
    st = json.loads(STATE.read_text()); done=pend=bad=0
    for pid, info in st.items():
        if info.get("saved"): done+=1; continue
        try:
            h = json.loads(pc._req("GET", f"/history/{pid}"))
        except Exception as e:
            print(" err", info["i"], e); pend+=1; continue
        if pid in h:
            status = h[pid].get("status",{}).get("status_str")
            if status == "success":
                dest = OUT/f"frame_{info['i']:02d}.png"
                pc.fetch_first_image(h[pid], str(dest)); info["saved"]=str(dest); done+=1
            else:
                bad+=1; print("  frame",info["i"],"->",status)
        else:
            pend+=1
    STATE.write_text(json.dumps(st, indent=2))
    print(f"WALK done={done} bad={bad} pend={pend}")

if __name__ == "__main__":
    (submit if sys.argv[1]=="submit" else poll)()
