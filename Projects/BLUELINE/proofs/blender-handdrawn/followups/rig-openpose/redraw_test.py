"""
BLUELINE — close the loop: rig plates -> pen-flow ink redraw.
img2img over the rig's ink plate, anchored by canny + depth + the CANONICAL openpose
(the D2 recipe: canny 0.30, depth 0.60, openpose 0.70, denoise 0.92).
Run: python3 redraw_test.py <pose_dir>
"""
import json, os, sys, shutil, time, urllib.request, uuid
SERVER="127.0.0.1:8188"
COMFY="/Users/loudonstearns/Documents/The Palace/_tools/ComfyUI"
INDIR, OUTDIR = os.path.join(COMFY,"input"), os.path.join(COMFY,"output")
ROOT="/Users/loudonstearns/Documents/The Palace/Projects/BLUELINE/proofs/blender-handdrawn"
LOCK=json.load(open(os.path.join(ROOT,"..","style-lock","locked-style.json")))
INK=("stark black and white pen and ink illustration, sumi-e brush, manga inking, heavy spotted blacks, "
     "bold dramatic sweeping flow lines, scattered ink splatter, rough white paper, lots of white space, "
     "film-noir deep shadow, a lone figure, dynamic pose, low canted angle")
NEG=LOCK["neg_extra"]
pose_dir=sys.argv[1]; tag=os.path.basename(pose_dir)

def stage(p,n): shutil.copyfile(p, os.path.join(INDIR,n)); return n
init=stage(os.path.join(pose_dir,"ink_plate.png"), f"rig_init_{tag}.png")
dep =stage(os.path.join(pose_dir,"depth_plate.png"), f"rig_depth_{tag}.png")
opn =stage(os.path.join(pose_dir,"openpose.png"), f"rig_pose_{tag}.png")

def cn(name): return {"class_type":"ControlNetLoader","inputs":{"control_net_name":name}}
def apply(pos,neg,net,img,s,e):
    return {"class_type":"ControlNetApplyAdvanced","inputs":{"positive":pos,"negative":neg,
        "control_net":net,"image":img,"strength":s,"start_percent":0.0,"end_percent":e,"vae":["ckpt",2]}}
g={
 "ckpt":{"class_type":"CheckpointLoaderSimple","inputs":{"ckpt_name":"sd_xl_base_1.0.safetensors"}},
 "pos":{"class_type":"CLIPTextEncode","inputs":{"text":INK,"clip":["ckpt",1]}},
 "neg":{"class_type":"CLIPTextEncode","inputs":{"text":NEG,"clip":["ckpt",1]}},
 "init":{"class_type":"LoadImage","inputs":{"image":init}},
 "cimg":{"class_type":"LoadImage","inputs":{"image":init}},
 "canny":{"class_type":"Canny","inputs":{"image":["cimg",0],"low_threshold":0.15,"high_threshold":0.4}},
 "dimg":{"class_type":"LoadImage","inputs":{"image":dep}},
 "pimg":{"class_type":"LoadImage","inputs":{"image":opn}},
 "cn_c":cn("controlnet-canny-sdxl.safetensors"),
 "cn_d":cn("controlnet-depth-sdxl.safetensors"),
 "cn_p":cn("controlnet-openpose-sdxl.safetensors"),
 # chain: canny 0.30 -> depth 0.60 -> openpose 0.70
 "a1":apply(["pos",0],["neg",0],["cn_c",0],["canny",0],0.30,0.50),
 "a2":apply(["a1",0],["a1",1],["cn_d",0],["dimg",0],0.60,0.70),
 "a3":apply(["a2",0],["a2",1],["cn_p",0],["pimg",0],0.70,0.80),
 "venc":{"class_type":"VAEEncode","inputs":{"pixels":["init",0],"vae":["ckpt",2]}},
 "ks":{"class_type":"KSampler","inputs":{"model":["ckpt",0],"positive":["a3",0],"negative":["a3",1],
     "latent_image":["venc",0],"seed":4242,"steps":26,"cfg":7.0,"sampler_name":"dpmpp_2m","scheduler":"karras","denoise":0.92}},
 "vd":{"class_type":"VAEDecode","inputs":{"samples":["ks",0],"vae":["ckpt",2]}},
 "sv":{"class_type":"SaveImage","inputs":{"images":["vd",0],"filename_prefix":"rig_redraw"}},
}
req=urllib.request.Request(f"http://{SERVER}/prompt",data=json.dumps({"prompt":g,"client_id":str(uuid.uuid4())}).encode(),
    headers={"Content-Type":"application/json"})
pid=json.loads(urllib.request.urlopen(req).read())["prompt_id"]; t0=time.time()
print("queued",pid,flush=True)
while True:
    time.sleep(3)
    h=json.loads(urllib.request.urlopen(f"http://{SERVER}/history/{pid}").read())
    if pid in h:
        for node in h[pid]["outputs"].values():
            for im in node.get("images",[]):
                out=os.path.join(OUTDIR,im.get("subfolder",""),im["filename"])
                dst=os.path.join(pose_dir,"redraw_D2.png"); shutil.copyfile(out,dst)
                print(f"done {time.time()-t0:.0f}s -> {dst}"); sys.exit(0)
    if time.time()-t0>1800: print("timeout"); sys.exit(1)
