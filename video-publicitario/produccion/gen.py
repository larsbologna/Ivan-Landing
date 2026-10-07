import torch, time, sys, json
from diffusers import StableDiffusionXLPipeline, DPMSolverMultistepScheduler
torch.set_num_threads(4)
M="/tmp/claude-0/-home-user-Ivan-Landing/ca74b661-1af8-5d2c-9c09-73ff27cceb17/scratchpad/models/sdxl"
OUT="/tmp/claude-0/-home-user-Ivan-Landing/ca74b661-1af8-5d2c-9c09-73ff27cceb17/scratchpad/build/img"
pipe=StableDiffusionXLPipeline.from_pretrained(M,torch_dtype=torch.bfloat16)
pipe.scheduler=DPMSolverMultistepScheduler.from_config(pipe.scheduler.config,use_karras_sigmas=True,algorithm_type="sde-dpmsolver++")
NEG=("text, letters, words, watermark, logo, signature, caption, cartoon, illustration, painting, anime, 3d render, cgi, "
     "plastic skin, deformed, disfigured, extra fingers, bad hands, mutated, blurry, lowres, oversaturated, neon, lens flare, "
     "jpeg artifacts, frame, border, collage, split screen")
STYLE=", cinematic still from a premium commercial, shot on ARRI Alexa, 35mm anamorphic lens, shallow depth of field, soft natural light, rich deep blacks, subtle warm gold highlights, high contrast, fine film grain, photorealistic, ultra detailed, 8k"
jobs=json.load(open(sys.argv[1]))
steps=int(sys.argv[2]) if len(sys.argv)>2 else 28
for j in jobs:
    t=time.time()
    g=torch.Generator().manual_seed(j.get("seed",7))
    im=pipe(prompt=j["prompt"]+STYLE,negative_prompt=NEG+", "+j.get("neg",""),width=j.get("w",768),height=j.get("h",1344),
            num_inference_steps=steps,guidance_scale=j.get("cfg",6.0),generator=g).images[0]
    im.save(f"{OUT}/{j['name']}.png"); print(j["name"],"%.0fs"%(time.time()-t),flush=True)
